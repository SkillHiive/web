import CubeScene from "../components/CubeScene";


const Hero = () => {
    return (
        <>
            <div className="Hero w-full h-dvh flex flex-column items-center hero-back">
                <div className="hero-content font-primary mx-12.5">
                    <div className="skillhive-hero text-xs my-4 color-primary">
                        Stay Connected
                    </div>
                    <div className="hero-heading font-bold text-5xl my-2 w-155">
                        Where Learning Stops being Boring
                    </div>
                    <div className="hero-desc w-120 text-xs my-4 text-gray-500">
                        A focused social learning platform designed for the Lock-In Culture, who want to optimize their time and upskill daily.
                    </div>
                    <div className="hero-buttons flex">
                        <div className="hero-btn bg-primary w-max text-black py-2.5 px-3 rounded-xl">
                            Get Started
                        </div>
                        <div className="hero-btn w-max text-white/40 ml-5 py-2.5 px-3 rounded-xl">
                            Learn more
                        </div>
                    </div>
                </div>
                <CubeScene className="absolute z-[-1] h-max overflow-hidden" />
            </div>
        </>
    )
}

export default Hero;