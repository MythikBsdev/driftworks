import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth/session";

const HomePage = async () => {
  const session = await getSession();

  if (session) {
    redirect("/dashboard");
  }

  redirect("/login");
};

export default HomePage;
