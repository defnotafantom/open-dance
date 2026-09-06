import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ registrato?: string }>;
}) {
  const { registrato } = await searchParams;
  return <LoginForm registrato={registrato === "1"} />;
}
