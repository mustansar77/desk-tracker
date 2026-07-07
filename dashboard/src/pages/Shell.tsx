import { useState } from "react";
import Sidebar, { type View } from "../components/Sidebar";
import TopHeader from "../components/TopHeader";
import Overview from "./Overview";
import EmployeesView from "./EmployeesView";
import ProjectsView from "./ProjectsView";
import OrganizationsView from "./OrganizationsView";
import SettingsView from "./SettingsView";

const TITLES: Record<View, string> = {
  dashboard: "Dashboard",
  employees: "Employees",
  projects: "Project tracking",
  organizations: "Organizations",
  settings: "Settings",
};

export default function Shell() {
  const [view, setView] = useState<View>("dashboard");

  return (
    <div className="h-screen flex bg-slate-50 dark:bg-slate-950">
      <Sidebar active={view} onNavigate={setView} />
      <div className="flex-1 flex flex-col min-w-0">
        <TopHeader title={TITLES[view]} />
        {view === "dashboard" && <Overview />}
        {view === "employees" && <EmployeesView />}
        {view === "projects" && <ProjectsView />}
        {view === "organizations" && <OrganizationsView />}
        {view === "settings" && <SettingsView />}
      </div>
    </div>
  );
}
