import { useState } from "react";
import Layout from "./components/Layout.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Domains from "./pages/Domains.jsx";
import Search from "./pages/Search.jsx";
import BackendKnowledge from "./pages/BackendKnowledge.jsx";
import Reports from "./pages/Reports.jsx";
import Brief from "./pages/Brief.jsx";

const pages = {
  dashboard: Dashboard,
  domains: Domains,
  search: Search,
  backend: BackendKnowledge,
  reports: Reports,
  brief: Brief
};

export default function App() {
  const [activePage, setActivePage] = useState("dashboard");
  const Page = pages[activePage] || Dashboard;

  return (
    <Layout activePage={activePage} onNavigate={setActivePage}>
      <Page />
    </Layout>
  );
}
