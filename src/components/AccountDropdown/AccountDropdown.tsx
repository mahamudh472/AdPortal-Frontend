import { useState, useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";

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
}

export default function AccountDropdown({
  first_name,
  email,
  avatar,
  organizations: rawOrganizations,
  selectedOrganization: propSelectedOrganization,
}: AccountDropdownProps) {
  const DEFAULT_AVATAR = "https://res.cloudinary.com/dqkczdjjs/image/upload/v1773093792/avatar-profile-icon-in-flat-style-male-user-profile-illustration-on-isolated-background-man-profile-sign-business-concept-vector_ufimxp.jpg";
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

  // Process raw organizations array to Organization objects
  const processedOrganizations: Organization[] = rawOrganizations.map((org) => {
    if (Array.isArray(org) && org.length >= 2) {
      return {
        id: org[0] || 'unknown',
        name: org[1] || null,
      };
    } else if (typeof org === 'object' && org !== null) {
      return {
        id: org.id || 'unknown',
        name: org.name || null,
      };
    } else if (typeof org === 'string') {
      return {
        id: org,
        name: null,
      };
    }
    return { id: 'unknown', name: null };
  });


  useEffect(() => {
    const initializeSelectedOrganization = () => {
      setIsLoading(true);
      
      try {
     
        const savedOrg = localStorage.getItem("selectedOrganization");
        let orgToSet = null;

        if (savedOrg) {
          const parsedOrg = JSON.parse(savedOrg);
         
          const orgExists = processedOrganizations.some(org => org.id === parsedOrg.id);
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


  // Add effect to sync localSelectedOrganization with localStorage on organizationChanged event
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
    window.addEventListener('organizationChanged', syncWithLocalStorage);
    // Also sync when dropdown is opened
    if (open) syncWithLocalStorage();
    return () => {
      window.removeEventListener('organizationChanged', syncWithLocalStorage);
    };
  }, [open]);

  const handleOrganizationSelect = (org: Organization) => {
  
    if (localSelectedOrganization?.id === org.id) {
      setLocalSelectedOrganization(org); // still update state for UI
      return;
    }
    setLocalSelectedOrganization(org);
    localStorage.setItem("selectedOrganization", JSON.stringify(org));
    window.dispatchEvent(new CustomEvent('organizationChanged', { 
      detail: org 
    }));
    console.log("Organization selected and saved:", org);
  };


  const getOrganizationNumber = (id: string): string => {
    if (!id || id === 'unknown') return "N/A";
    
    const length = id.length;
    return id.substring(Math.max(0, length - 6));
  };

 
  const formatOrganizationId = (id: string): string => {
    if (!id || id === 'unknown') return "N/A";
    
    if (id.length > 12) {
      return `${id.substring(0, 6)}...${id.substring(id.length - 4)}`;
    }
    return id;
  };


  const getOrganizationDisplayName = (org: Organization): string => {
    try {
      const savedOrg = localStorage.getItem("selectedOrganization");
      if (savedOrg) {
        const parsedOrg = JSON.parse(savedOrg);
        if (parsedOrg.id === org.id && parsedOrg.name && parsedOrg.name.trim() !== "") {
          return parsedOrg.name;
        }
      }
    } catch {}
    if (!org) return "N/A";
    if (org.name && org.name !== null && org.name.trim() !== "") {
      return org.name;
    }
    const orgNumber = getOrganizationNumber(org.id);
    return `Organization ${orgNumber}`;
  };


  const getOrganizationInitial = (org: Organization): string => {
    try {
      const savedOrg = localStorage.getItem("selectedOrganization");
      if (savedOrg) {
        const parsedOrg = JSON.parse(savedOrg);
        if (parsedOrg.id === org.id && parsedOrg.name && parsedOrg.name.trim() !== "") {
          return parsedOrg.name.charAt(0).toUpperCase();
        }
      }
    } catch {}
    if (!org) return "O";
    if (org.name && org.name !== null && org.name.trim() !== "") {
      return org.name.charAt(0).toUpperCase();
    }
    return "O";
  };

  const isOrganizationSelected = (orgId: string): boolean => {
    return localSelectedOrganization?.id === orgId;
  };

  if (isLoading) {
    return (
      <div className="relative px-4 ">
        <div className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-medium text-gray-700">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-gray-200 animate-pulse"></div>
            <div className="space-y-1">
              <div className="h-2.5 w-16 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-1.5 w-12 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
          <div className="h-3 w-3 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative px-4 mt-2" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center cursor-pointer justify-between rounded-sm    px-1 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 border-2 border-transparent transition-colors"
      >
        <div className="flex items-center gap-2">
          <img
            src={avatar || DEFAULT_AVATAR}
            alt="user"
            className="h-5 w-5 rounded-full object-cover"
          />
          <div className="text-left">
            <div className="text-xs  font-medium text-gray-900 line-clamp-1">
              {first_name}
            </div>
            <div className="text-[14px] text-gray-900 line-clamp-1 ">
              {localSelectedOrganization 
                ? getOrganizationDisplayName(localSelectedOrganization) 
                : "Select Organization"}
            </div>
          </div>
        </div>
        <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute left-4 right-4 z-50 mt-1 rounded-xl bg-white shadow-lg border border-gray-200 px-2 py-2">
          {/* User Info Section - Moved to top */}
          {/* ...existing code... */}
          <div className="p-2 max-h-56 overflow-y-auto">
            <p className="mb-1 px-1 text-[10px] font-bold text-gray-800  uppercase">
              Switch Organization
            </p>

            {processedOrganizations.length > 0 ? (
              <div className="space-y-0.5">
                {processedOrganizations.map((org) => {
                  const isSelected = isOrganizationSelected(org.id);

                  return (
                    <div
                      key={org.id}
                      onClick={() => handleOrganizationSelect(org)}
                      className={`flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 transition-all
                        ${
                          isSelected
                            ? "bg-blue-50 border border-blue-400"
                            : "hover:bg-gray-50 border border-transparent"
                        }
                      `}
                    >
                      <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium
                        ${isSelected ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700"}`}>
                        {getOrganizationInitial(org)}
                      </div>

                      <a href="" className="flex-1 min-w-0">
                        <div className={`text-xs font-medium truncate
                          ${isSelected ? "text-blue-600" : "text-gray-800"}`}>
                          {getOrganizationDisplayName(org)}
                        </div>
                        <div className="text-[10px] truncate mt-0.5">
                          <span className={isSelected ? "text-blue-500" : "text-gray-500"}>
                            ID: {formatOrganizationId(org.id)}
                          </span>
                        </div>
                      </a>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-4 text-center text-xs text-gray-500">
                No organizations available
              </div>
            )}
          </div>

            <div>

              <div>
                <p className="pl-2 font-semibold">Account</p>
              </div>
              <div className="border-b border-gray-100 p-2 bg-gray-50 rounded-t-xl">
            <div className="flex items-center gap-2">
              <img
                src={avatar || DEFAULT_AVATAR}
                className="h-6 w-6 rounded-full object-cover"
                alt="User"
              />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-gray-800 truncate">
                  {first_name}
                </div>
                <div className="text-[12px] text-gray-600 truncate">
                  {email}
                </div>
              </div>
            </div>
          </div>


            </div>


        </div>
      )}
    </div>
  );
}