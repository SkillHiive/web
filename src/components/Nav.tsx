import { useState } from "react";
import LinkNav from "./LinkNav";
import { useLocation } from "react-router";


const Nav = () => {
    const location = useLocation();
    const isHome = location.pathname.startsWith("/home");
    const [text, setText] = useState("");
    return (
        <div className={`nav fixed left-0 w-full flex justify-center transition-ui ` + (isHome ? 'bottom-4' : 'bottom-[90%]')}>
            <div className="wrapper rounded-2xl flex p-1 bg-[#0c0f14] border-[0.5px] border-[#242424]  justify-center">
                <div className="nav-left  flex justify-start items-center">
                    <div className="nav-brand text-xl font-bold mx-2 mr-3 color-primary font-primary">
                        <img alt="" />
                        SkillHive
                    </div>
                    <div className="nav-skill-search-box relative w-auto flex items-center">
                        <input type="text" value={text} onChange={(e) => setText(e.target.value)} onBlur={() => setText("")} placeholder='Explore...' className="search-box select-none w-10.25 text-transparent focus:text-white placeholder-transparent focus:placeholder-grey-100 focus:w-50 transition-ui border-1 border-white/10   outline-0 bg-white/5 hover:bg-white/15 cursor-pointer focus:bg-white/15 rounded-full px-3 py-2" />
                        <i className='fa fa-search absolute right-2.75 pointer-events-none'></i>
                    </div>
                </div>
                <div className="nav-center  flex justify-center">
                    <div className="nav-links flex items-center justify-center">
                        <LinkNav to="/home" iconType="regular" icon="home" className="" />
                        <LinkNav to="/learn" iconType="solid" icon="brain" className="" />
                        <LinkNav to="/chat" iconType="regular" icon="comment-dots" className="" />
                        <a className="nav-link font-lg mx-3">
                            <i className="fa-regular fa-bell text-white text-xl hover:text-[#fffd01] transition-ui"></i>
                        </a>
                    </div>
                </div>
                <div className="nav-right w-[25%] flex justify-end items-center">
                    <div className="profile-btn bg-primary text-black px-3 py-2 hover:px-3 rounded-2xl border-1 border-[#fffd01]">
                        Lock In
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Nav;