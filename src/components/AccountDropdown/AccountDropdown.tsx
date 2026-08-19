import { useState, useEffect, useRef } from "react";
import { ChevronDown, Check, LogOut, Building } from "lucide-react";

interface Organization {
  id: string;
  name: string | null;
}

interface AccountDropdownProps {
  first_name: string;
  email: string;
  avatar?: string | null;
  organizations: any[];
  selectedOrganization: Organization | null;
  onLogout?: () => void;
}

export default function AccountDropdown({
  first_name,
  email,
  avatar,
  organizations: rawOrganizations,
  selectedOrganization: propSelectedOrganization,
  onLogout,
}: AccountDropdownProps) {
  const [open, setOpen] = useState(false);
  const [localSelectedOrganization, setLocalSelectedOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  // Process raw organizations array
  const processedOrganizations: Organization[] = rawOrganizations.map((org) => {
    if (Array.isArray(org) && org.length >= 2) {
      return {
        id: org[0] || "unknown",
        name: org[1] || null,
      };
    } else if (typeof org === "object" && org !== null) {
      return {
        id: org.id || "unknown",
        name: org.name || null,
      };
    } else if (typeof org === "string") {
      return {
        id: org,
        name: null,
      };
    }
    return { id: "unknown", name: null };
  });

  useEffect(() => {
    const initializeSelectedOrganization = () => {
      setIsLoading(true);
      try {
        const savedOrg = localStorage.getItem("selectedOrganization");
        let orgToSet = null;

        if (savedOrg) {
          const parsedOrg = JSON.parse(savedOrg);
          const orgExists = processedOrganizations.some((org) => org.id === parsedOrg.id);
          if (orgExists) {
            orgToSet = parsedOrg;
          }
        }

        if (!orgToSet && propSelectedOrganization) {
          orgToSet = propSelectedOrganization;
        }

        if (!orgToSet && processedOrganizations.length > 0) {
          orgToSet = processedOrganizations[0];
          localStorage.setItem("selectedOrganization", JSON.stringify(orgToSet));
        }

        setLocalSelectedOrganization(orgToSet);
      } catch (error) {
        console.error("Error initializing selected organization:", error);
        if (processedOrganizations.length > 0) {
          const defaultOrg = processedOrganizations[0];
          setLocalSelectedOrganization(defaultOrg);
          localStorage.setItem("selectedOrganization", JSON.stringify(defaultOrg));
        }
      } finally {
        setIsLoading(false);
      }
    };

    initializeSelectedOrganization();
  }, []);

  useEffect(() => {
    const syncWithLocalStorage = () => {
      const savedOrg = localStorage.getItem("selectedOrganization");
      if (savedOrg) {
        try {
          const parsedOrg = JSON.parse(savedOrg);
          setLocalSelectedOrganization(parsedOrg);
        } catch {}
      }
    };
    window.addEventListener("organizationChanged", syncWithLocalStorage);
    if (open) syncWithLocalStorage();
    return () => {
      window.removeEventListener("organizationChanged", syncWithLocalStorage);
    };
  }, [open]);

  const handleOrganizationSelect = (org: Organization) => {
    if (localSelectedOrganization?.id === org.id) {
      setLocalSelectedOrganization(org);
      setOpen(false);
      return;
    }
    setLocalSelectedOrganization(org);
    localStorage.setItem("selectedOrganization", JSON.stringify(org));
    window.dispatchEvent(
      new CustomEvent("organizationChanged", {
        detail: org,
      })
    );
    setOpen(false);
  };

  const getOrganizationDisplayName = (org: Organization): string => {
    try {
      const savedOrg = localStorage.getItem("selectedOrganization");
      if (savedOrg) {
        const parsedOrg = JSON.parse(savedOrg);
        if (parsedOrg.id === org?.id && parsedOrg.name && parsedOrg.name.trim() !== "") {
          return parsedOrg.name;
        }
      }
    } catch {}
    if (!org) return "AdPortal Team";
    if (org.name && org.name !== null && org.name.trim() !== "") {
      return org.name;
    }
    if (org.id && org.id !== "unknown") {
      return `Organization ${org.id.substring(Math.max(0, org.id.length - 4))}`;
    }
    return "AdPortal Team";
  };

  const getInitials = (name: string, org: Organization | null): string => {
    if (org && org.name && org.name.trim() !== "") {
      const parts = org.name.trim().split(" ");
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return org.name.substring(0, 2).toUpperCase();
    }
    if (name && name.trim() !== "") {
      return name.substring(0, 2).toUpperCase();
    }
    return "AP";
  };

  const isOrganizationSelected = (orgId: string): boolean => {
    return localSelectedOrganization?.id === orgId;
  };

  if (isLoading) {
    return (
      <div className="w-full px-3 py-2 rounded-2xl bg-slate-50 border border-slate-100 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-slate-200"></div>
          <div className="space-y-1.5 flex-1">
            <div className="h-3 w-20 bg-slate-200 rounded"></div>
            <div className="h-2.5 w-28 bg-slate-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* Dropdown Popup (Opens Upwards above button) */}
      {open && (
        <div className="absolute bottom-full mb-2 left-0 right-0 z-50 rounded-2xl bg-white shadow-xl border border-slate-100 p-2 space-y-2 text-xs animate-in fade-in slide-in-from-bottom-2 duration-150">
          {/* Switch Organization Section */}
          <div className="p-1">
            <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Switch Organization
            </div>

            {processedOrganizations.length > 0 ? (
              <div className="space-y-0.5 mt-1 max-h-40 overflow-y-auto">
                {processedOrganizations.map((org) => {
                  const isSelected = isOrganizationSelected(org.id);
                  const displayName = getOrganizationDisplayName(org);

                  return (
                    <button
                      key={org.id}
                      onClick={() => handleOrganizationSelect(org)}
                      className={`flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-xs font-medium transition-all ${
                        isSelected
                          ? "bg-blue-50 text-blue-600 font-semibold"
                          : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            isSelected ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          <Building className="w-3 h-3" />
                        </div>
                        <span className="truncate">{displayName}</span>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="py-2 px-2 text-[11px] text-slate-400">No other organizations</div>
            )}
          </div>

          <div className="border-t border-slate-100 pt-1">
            {/* User Details */}
            <div className="px-2 py-1.5 flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-[10px]">
                {first_name ? first_name[0].toUpperCase() : "U"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-slate-800 truncate">{first_name || "User"}</div>
                <div className="text-[10px] text-slate-400 truncate">{email}</div>
              </div>
            </div>

            {/* Logout Option inside Dropdown */}
            {onLogout && (
              <button
                onClick={() => {
                  setOpen(false);
                  onLogout();
                }}
                className="mt-1 flex items-center gap-2 w-full px-2.5 py-2 text-xs font-semibold text-red-500 hover:bg-red-50 rounded-xl transition-colors text-left"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log out</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Bottom Card Button (Matches attached image) */}
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between rounded-2xl bg-white border border-slate-200/80 p-3 shadow-sm hover:bg-slate-50 transition-all text-left cursor-pointer group"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-9 w-9 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-sm">
            {avatar ? (
              <img src={avatar} alt="user" className="h-9 w-9 rounded-full object-cover" />
            ) : (
              getInitials(first_name, localSelectedOrganization)
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-slate-900 truncate">
              {localSelectedOrganization
                ? getOrganizationDisplayName(localSelectedOrganization)
                : first_name || "AdPortal Team"}
            </div>
            <div className="text-[11px] text-slate-400 truncate mt-0.5">
              {email || "team@adportal.com"}
            </div>
          </div>
        </div>
        <ChevronDown
          className={`h-4 w-4 text-slate-400 shrink-0 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
    </div>
  );
}