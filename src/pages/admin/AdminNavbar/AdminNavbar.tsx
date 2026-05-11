import { useUserProfile } from "@/hooks/useUserProfile";
import NotificationBell from "@/Notification/NotificationBell";


const AdminNavbar = () => {
    const { full_name, is_admin, avatar } = useUserProfile();
    const DEFAULT_AVATAR = "https://res.cloudinary.com/dqkczdjjs/image/upload/v1773093792/avatar-profile-icon-in-flat-style-male-user-profile-illustration-on-isolated-background-man-profile-sign-business-concept-vector_ufimxp.jpg";

    return (
        <div>
            <div className="navbar bg-base-100 border-b-2 px-4">
                <div className="navbar-start">
                    <div className="dropdown"></div>
                </div>
                
                <div className="navbar-center hidden lg:flex"></div>
                
                <div className="navbar-end">
                    <div className='flex items-center gap-4'>
                        
                         <div className="lg:flex hidden"><NotificationBell /></div>
                        
                        <div className='flex flex-col text-right  pr-3 pl-3 rounded-xl'>
                            <p className='text-sm whitespace-nowrap font-semibold'>{full_name}</p>
                            <p className='text-xs text-gray-500 '>{is_admin ? 'Admin' : 'User'}</p>
                        </div>

                        <div className="h-10 w-10 rounded-full overflow-hidden border border-slate-200">
                            <img 
                                src={avatar || DEFAULT_AVATAR} 
                                alt="profile" 
                                className="h-full w-full object-cover"
                            />
                        </div>

                        <div className=" pr-2 lg:hidden ">
                           <NotificationBell />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminNavbar;