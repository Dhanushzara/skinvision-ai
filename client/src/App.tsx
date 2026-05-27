import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import Home from "@/pages/Home";
import ScanResult from "@/pages/ScanResult";
import FindDermatologist from "@/pages/FindDermatologist";
import SelfCare from "@/pages/SelfCare";
import History from "@/pages/History";
import TeleDerm from "@/pages/TeleDerm";
import SharedReport from "@/pages/SharedReport";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/result/:id" component={ScanResult} />
      <Route path="/analyze" component={Home} />
      <Route path="/dermatologist" component={FindDermatologist} />
      <Route path="/self-care" component={SelfCare} />
      <Route path="/history" component={History} />
      <Route path="/telederm" component={TeleDerm} />
      <Route path="/shared/:token" component={SharedReport} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
