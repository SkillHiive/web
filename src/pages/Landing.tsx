import Footer from "@/components/Footer";
import Features from "./Features";
import Hero from "./Hero";
import SwipeLayout from "@/components/SwipeLayout";

const Landing = () => {
  return (
    <SwipeLayout>
      <div style={{ width: "100%" }}>
        <Hero />
        <Features />
        <Footer />
      </div>
    </SwipeLayout>
  );
};

export default Landing;
