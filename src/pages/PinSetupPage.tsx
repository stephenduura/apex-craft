import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PinSetup from "@/components/PinSetup";

const PinSetupPage = () => {
  const navigate = useNavigate();

  return (
    <PinSetup
      onComplete={() => navigate("/profile")}
      onBack={() => navigate(-1)}
    />
  );
};

export default PinSetupPage;
