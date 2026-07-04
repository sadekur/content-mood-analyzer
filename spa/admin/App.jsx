import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Import your pages
import Overview from "./pages/Overview";
import Dashboard from "./pages/Dashboard";
import Sentiments from "./pages/Sentiments";
import Settings from "./pages/Settings";

// The Overview/top-level menu link has no #hash (unlike Dashboard/All
// Sentiments/Settings), so it needs to be told apart from the other
// submenu links in a couple of places below.
const isOverviewHref = (href) => href.indexOf("#") === -1 && /page=content-mood-analyzer$/.test(href);

const App = () => {
    const [activeTab, setActiveTab] = useState("");
    const [page, setPage] = useState(1);

    const getPageFromPath = (path) => {
        const pageRegex = /\/page\/(\d+)$/;
        const match = path.match(pageRegex);
        return match ? Number(match[1]) : 1;
    };

    useEffect(() => {
        const handleHashChange = () => {
            const hash = window.location.hash.replace("#", "") || "";
            const [hashPath] = hash.split("/page/");
            const currentPage = getPageFromPath(hash);
            
            setActiveTab(hashPath); // Set only the path without /page/X
            setPage(currentPage);    // Set the page number
        };

        window.addEventListener("hashchange", handleHashChange);
        handleHashChange();

        return () => window.removeEventListener("hashchange", handleHashChange);
    }, []);

    // WordPress only ever sees ?page=content-mood-analyzer - it has no idea
    // about the #/dashboard-style hash this SPA routes on, so its
    // server-rendered "current" submenu highlight always lands on Overview.
    // Fix it up client-side to match whichever hash-page is actually shown.
    useEffect(() => {
        const topLevelMenu = document.getElementById("toplevel_page_content-mood-analyzer");
        if (!topLevelMenu) return;

        const submenuLinks = topLevelMenu.querySelectorAll(".wp-submenu a");
        submenuLinks.forEach((link) => {
            link.parentElement.classList.remove("current");
            link.removeAttribute("aria-current");
        });

        const isMatch = (href) =>
            activeTab && activeTab !== "/" ? href.endsWith("#" + activeTab) : isOverviewHref(href);

        submenuLinks.forEach((link) => {
            if (isMatch(link.getAttribute("href") || "")) {
                link.parentElement.classList.add("current");
                link.setAttribute("aria-current", "page");
            }
        });
    }, [activeTab]);

    // Going from a #hash URL to the Overview/top-level link's bare, hash-less
    // URL is a real navigation as far as the browser is concerned (unlike
    // switching between two #hash URLs, which browsers treat as instant),
    // so clicking it mid-SPA caused a full page reload. Intercept those
    // clicks and just clear the hash ourselves instead.
    useEffect(() => {
        const topLevelMenu = document.getElementById("toplevel_page_content-mood-analyzer");
        if (!topLevelMenu) return;

        const handleClick = (event) => {
            const link = event.target.closest("a");
            if (!link || !isOverviewHref(link.getAttribute("href") || "")) return;

            event.preventDefault();

            if (window.location.hash) {
                window.location.hash = "";
            } else {
                // Already at Overview with an empty hash - clearing it again
                // wouldn't fire a hashchange event, so update state directly.
                setActiveTab("");
                setPage(1);
            }
        };

        topLevelMenu.addEventListener("click", handleClick);
        return () => topLevelMenu.removeEventListener("click", handleClick);
    }, []);

    const renderContent = () => {
        switch (activeTab) {
            case "":
            case "/":
                return <Overview />;
            case "/dashboard":
                return <Dashboard />;
            case "/sentiments":
                return <Sentiments page={page} />;
            case "/settings":
                return <Settings />;
            default:
                return <Overview />;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {renderContent()}
                </div>
            </div>

            <ToastContainer position="bottom-right" />
        </div>
    );
};

// Mount React app
const container = document.getElementById("sentiment-root");
if (container) {
    const root = createRoot(container);
    root.render(<App />);
}