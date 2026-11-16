import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PickupScreen } from "@/components/pickup-screen";
import {
  ensureProfile,
  getActiveOrder,
  type ActiveOrder,
  type ProfileRow,
} from "@/lib/delivery.functions";
import { useCurrentUserState } from "@/lib/auth/use-current-user";

export const Route = createFileRoute("/")({
  loader: () => getActiveOrder(),
  component: Home,
});

function Home() {
  const initial = Route.useLoaderData();
  const [order, setOrder] = useState<ActiveOrder | null>(initial);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const { user, isPending } = useCurrentUserState();

  useEffect(() => {
    setOrder(initial);
  }, [initial]);

  useEffect(() => {
    if (isPending || !user) {
      setProfile(null);
      return;
    }
    const label = user.displayName ?? user.primaryEmail ?? "";
    ensureProfile({ data: label })
      .then(setProfile)
      .catch(() => setProfile(null));
  }, [user, isPending]);

  if (!order) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md items-center justify-center bg-card px-6 text-center">
        <p className="text-lg font-semibold">No hay pedidos para recolectar.</p>
      </main>
    );
  }

  return <PickupScreen order={order} onOrder={setOrder} profile={profile} />;
}
