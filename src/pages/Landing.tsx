import Footer from "@/components/Footer";
import Features from "./Features";
import Hero from "./Hero";
import SwipeLayout from "@/components/SwipeLayout";
import { OpenSource } from "./OpenSource";

const Landing = () => {
  return (
    <SwipeLayout>
      <div className="relative overflow-hidden p-0 m-0" style={{ width: "100%" }}>
        <Hero />
        <Features />
        <OpenSource />
        <Footer />
      </div>
    </SwipeLayout>
  );
};

export default Landing;
