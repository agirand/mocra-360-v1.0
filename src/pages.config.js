/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import AccountDetail from './pages/AccountDetail';
import Accounts from './pages/Accounts';
import Brands from './pages/Brands';
import Contacts from './pages/Contacts';
import ControlCenter from './pages/ControlCenter';
import CreateWorkspace from './pages/CreateWorkspace';
import Dashboard from './pages/Dashboard';
import Facilities from './pages/Facilities';
import Onboarding from './pages/Onboarding';
import Opportunities from './pages/Opportunities';
import Projects from './pages/Projects';
import SaaSDashboard from './pages/SaaSDashboard';
import WorkspaceSettings from './pages/WorkspaceSettings';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AccountDetail": AccountDetail,
    "Accounts": Accounts,
    "Brands": Brands,
    "Contacts": Contacts,
    "ControlCenter": ControlCenter,
    "CreateWorkspace": CreateWorkspace,
    "Dashboard": Dashboard,
    "Facilities": Facilities,
    "Onboarding": Onboarding,
    "Opportunities": Opportunities,
    "Projects": Projects,
    "SaaSDashboard": SaaSDashboard,
    "WorkspaceSettings": WorkspaceSettings,
}

export const pagesConfig = {
    mainPage: "Onboarding",
    Pages: PAGES,
    Layout: __Layout,
};