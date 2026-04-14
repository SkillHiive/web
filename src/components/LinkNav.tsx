import { NavLink } from 'react-router';

type LinkProps = {
    className: string;
    to: string;
    icon: string;
    iconType: string;
    // children: React.ReactNode;
};

const LinkNav = ({ className, to, icon, iconType }: LinkProps) => {
    return (
        <NavLink viewTransition to={to} className={`nav-link font-lg mx-3 ` + className}>
            <i className={`fa-${iconType} fa-${icon} text-white text-xl hover:text-[#fffd01] transition-ui`}></i>
            {/* {children} */}
        </NavLink>
    )
}

export default LinkNav;