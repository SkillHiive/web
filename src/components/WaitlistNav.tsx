import { useState } from "react";
import { LinkNav } from "./LinkNav";
import { useLocation } from "react-router";
import { KineticText } from "./ui/kinetic-text";
import IOS from "@/assets/ios_download.webp";
import ANDROID from "@/assets/android_download.png";
import SkillHive from "@/assets/skillhive.png";

const Nav = () => {
  return (
    <div
      className={`nav fixed left-0 z-[1000] w-full flex justify-center transition-ui top-[2%]`}
    >
      <div className="wrapper rounded-2xl w-full space-between flex w-[100%] justify-between transition-ui">
        <div className="nav-center w-full flex justify-center hover:mx-2 hover:scale-[1.05] transition-ui">
          <div className="nav-brand w-max text-2xl font-bold color-primary px-2 py-1 bg-black rounded-2xl border-[0.5px] font-primary">
            <img src={SkillHive} className="w-50" alt="" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Nav;
