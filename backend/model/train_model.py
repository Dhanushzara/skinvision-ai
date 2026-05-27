"""
SkinVision AI — EfficientNetB3 Transfer Learning
Dataset: HAM10000 (ISIC) + ACNE04 + DermNet
Target: >92% validation accuracy, >0.95 AUC

Dataset layout expected:
  data/train/
    mole/       ← HAM10000 mel + nv classes
    non_mole/   ← HAM10000 bcc + akiec + bkl + df + vasc
    pimple/     ← ACNE04 + DermNet acne images (~2000 imgs)
    healthy/    ← DermNet normal skin (~1500 imgs)
"""

import tensorflow as tf
from tensorflow.keras.applications import EfficientNetB3
from tensorflow.keras.layers import (
    GlobalAveragePooling2D, Dense, Dropout, BatchNormalization,
)
from tensorflow.keras.models import Model
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau, ModelCheckpoint
import os

IMG_SIZE = (224, 224)
BATCH_SIZE = 32
EPOCHS = 50
NUM_CLASSES = 4
CLASS_NAMES = ["mole", "non_mole", "pimple", "healthy"]
# Upweight moles (rarest + most critical) and pimples (underrepresented)
CLASS_WEIGHTS = {0: 2.5, 1: 1.0, 2: 1.8, 3: 1.0}


def build_model() -> Model:
    base = EfficientNetB3(
        include_top=False,
        weights="imagenet",
        input_shape=(*IMG_SIZE, 3),
    )
    # Freeze all but the top 40 layers for fine-tuning
    for layer in base.layers[:-40]:
        layer.trainable = False

    x = GlobalAveragePooling2D()(base.output)
    x = BatchNormalization()(x)
    x = Dense(512, activation="swish")(x)
    x = Dropout(0.45)(x)
    x = Dense(256, activation="swish")(x)
    x = Dropout(0.35)(x)
    output = Dense(NUM_CLASSES, activation="softmax")(x)

    model = Model(inputs=base.input, outputs=output)
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=1e-4),
        loss=tf.keras.losses.CategoricalCrossentropy(label_smoothing=0.05),
        metrics=[
            "accuracy",
            tf.keras.metrics.AUC(name="auc", multi_label=False),
        ],
    )
    return model


def make_datagen(validation: bool = False) -> ImageDataGenerator:
    if validation:
        return ImageDataGenerator(rescale=1.0 / 255, validation_split=0.2)
    return ImageDataGenerator(
        rescale=1.0 / 255,
        rotation_range=45,
        width_shift_range=0.2,
        height_shift_range=0.2,
        shear_range=0.2,
        zoom_range=0.35,
        horizontal_flip=True,
        vertical_flip=True,
        brightness_range=[0.65, 1.35],
        channel_shift_range=30,
        fill_mode="nearest",
        validation_split=0.2,
    )


def train():
    os.makedirs("models", exist_ok=True)

    aug = make_datagen(validation=False)
    train_gen = aug.flow_from_directory(
        "data/train",
        target_size=IMG_SIZE,
        batch_size=BATCH_SIZE,
        class_mode="categorical",
        subset="training",
        shuffle=True,
    )
    val_gen = make_datagen(validation=True).flow_from_directory(
        "data/train",
        target_size=IMG_SIZE,
        batch_size=BATCH_SIZE,
        class_mode="categorical",
        subset="validation",
        shuffle=False,
    )

    model = build_model()
    model.summary()

    callbacks = [
        EarlyStopping(patience=12, restore_best_weights=True, monitor="val_auc", mode="max"),
        ReduceLROnPlateau(factor=0.4, patience=5, min_lr=1e-7, monitor="val_loss"),
        ModelCheckpoint(
            "models/skinvision_best.keras",
            save_best_only=True,
            monitor="val_auc",
            mode="max",
        ),
    ]

    history = model.fit(
        train_gen,
        validation_data=val_gen,
        epochs=EPOCHS,
        class_weight=CLASS_WEIGHTS,
        callbacks=callbacks,
    )

    # Save in both .keras and legacy .h5 formats
    model.save("models/skinvision_final.keras")
    model.save("models/skinvision_final.h5")
    print("✅ Training complete.")
    print(f"   Best val AUC: {max(history.history['val_auc']):.4f}")
    print(f"   Best val accuracy: {max(history.history['val_accuracy']):.4f}")


if __name__ == "__main__":
    train()
