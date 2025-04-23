import { ReactNode } from "react";

interface AuthLayoutProps {
  children: ReactNode;
}

const AuthLayout = ({ children }: AuthLayoutProps) => {
  return <div className="flex justify-center items-center relative min-h-screen">{children}</div>;
};

export default AuthLayout;
