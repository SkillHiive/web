import { NumberTicker } from "@/components/ui/number-ticker";
import { Highlighter } from "@/components/ui/highlighter";
import { DotPattern } from "@/components/ui/dot-pattern";
import { cn } from "@/lib/utils";

const AmbientLayer = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
    <div className="absolute top-[-10%] left-[20%] w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,rgba(255,253,1,0.05)_0%,transparent_60%)]" />
    <div className="absolute bottom-[-15%] right-[10%] w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,rgba(255,253,1,0.03)_0%,transparent_65%)]" />
  </div>
);

const SocialProof = () => (
  <div className="flex items-center justify-center gap-0">
    <span className="text-[13px] text-white/40">In the Making</span>
  </div>
);

const Hero = () => {
  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(14px); }
          to   { opacity:1; transform:translateY(0); }
        }

        .fade {
          opacity: 0;
          animation: fadeUp 0.6s ease forwards;
        }
      `}</style>

      <div className="w-full min-h-dvh flex flex-col items-center justify-center bg-[#080808] text-center px-6 relative overflow-hidden">
        <AmbientLayer />
        <DotPattern
          className={cn(
            "[mask-image:radial-gradient(600px_circle_at_center,white,transparent)]",
            "opacity-[0.4]",
          )}
        />

        <h1
          className="fade text-[clamp(34px,5vw,60px)] font-extrabold text-[#f0f0f0] leading-[1.05] tracking-[-0.04em] max-w-[680px]"
          style={{ animationDelay: "0.05s" }}
        >
          A <span className="text-[#fffd01]">Space</span> more than <br />
          <Highlighter action="underline" iterations={3}>
            {" "}
            Social Media
          </Highlighter>
        </h1>

        <div
          className="fade mt-8 mb-2 inline-flex items-center backdrop-blur gap-2 bg-primary/[0.07] border border-primary/[0.18] rounded-full px-3.5 py-1.5"
          style={{ animationDelay: "0.18s" }}
        >
          <div className="pulse-dot w-[6px] h-[6px] rounded-full bg-primary flex-shrink-0" />
          <span className="text-[16px]  font-bold text-primary tracking-[0.03em]">
            Social, with intention.
          </span>
        </div>

        <p
          className="fade text-[16px] text-white/60 max-w-[420px] leading-[1.7]"
          style={{ animationDelay: "0.28s" }}
        >
          Connect genuinely, grow together,<br></br> and build real world
          skills.
        </p>

        <div className="fade mt-8" style={{ animationDelay: "0.38s" }}>
          <SocialProof />
        </div>

        <div
          className="fade mt-2 flex flex-col items-center gap-3"
          style={{ animationDelay: "0.48s" }}
        >
          <button className="bg-primary text-[#080808] text-[17px] font-bold py-3 px-7 rounded-xl tracking-[-0.01em] transition-all duration-200 hover:scale-[1.08] active:scale-[1.04] active:shadow-[0_0_14px_#FFFD0155] hover:shadow-[0_0_28px_#FFFD0155] cursor-pointer border-none">
            Join early access →
          </button>

          <span className="text-white/25 text-[12px]">
            No clutter. No noise. Just focused people.
          </span>
        </div>
      </div>
    </>
  );
};

export default Hero;
