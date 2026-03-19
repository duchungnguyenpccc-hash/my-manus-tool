import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import { useEffect } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import DashboardPage from "./pages/Dashboard";
import Settings from "./pages/Settings";
import ScheduleManagement from "./pages/ScheduleManagement";
import ProjectDetails from "./pages/ProjectDetails";
import TrendResearch from "./pages/TrendResearch";
import Analytics from "./pages/Analytics";
import WorkflowVisualization from "./pages/WorkflowVisualization";
import AdvancedAnalytics from "./pages/AdvancedAnalytics";
import WorkflowBuilder from "./pages/WorkflowBuilder";
import CSVImport from "./pages/CSVImport";
import AdvancedSettingsPage from "./pages/AdvancedSettings";
import { AutoOptimizationDashboard } from "./pages/AutoOptimizationDashboard";
import APIProviderSettings from "./pages/APIProviderSettings";
import { Niches } from "./pages/Niches";
import TopicAnalyzer from "./pages/TopicAnalyzer";

function RedirectTo({ path }: { path: string }) {
  const [, setLocation] = useLocation();

  useEffect(() => {
    setLocation(path, { replace: true });
  }, [path, setLocation]);

  return null;
}

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"}>
        <RedirectTo path="/dashboard" />
      </Route>
      <Route path={"/app-auth"}>
        <RedirectTo path="/dashboard" />
      </Route>
      <Route path={"/dashboard"} component={DashboardPage} />
      <Route path={"/settings"} component={Settings} />
      <Route path={"/schedules"} component={ScheduleManagement} />
      <Route path={"/trends"} component={TrendResearch} />
      <Route path={"/analytics"} component={Analytics} />
      <Route path={"/workflow"} component={WorkflowVisualization} />
       <Route path="/workflow-builder" component={WorkflowBuilder} />
      <Route path="/csv-import" component={CSVImport} />
      <Route path="/advanced-analytics" component={AdvancedAnalytics} />
      <Route path="/advanced-settings" component={AdvancedSettingsPage} />
      <Route path="/auto-optimization" component={AutoOptimizationDashboard} />
      <Route path="/api-providers" component={APIProviderSettings} />
      <Route path="/niches" component={Niches} />
      <Route path="/topic-analyzer" component={TopicAnalyzer} />
      <Route path={"/home"} component={Home} />
      <Route path={"/project/:id"} component={ProjectDetails} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="dark"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
