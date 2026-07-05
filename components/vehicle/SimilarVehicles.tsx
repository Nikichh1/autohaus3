import type { Vehicle } from "@/types";
import { VehicleCard } from "@/components/vehicle/VehicleCard";
import { FadeIn } from "@/components/motion/FadeIn";
import { SplitText } from "@/components/motion/SplitText";

export function SimilarVehicles({ vehicles }: { vehicles: Vehicle[] }) {
  if (vehicles.length === 0) return null;
  return (
    <div>
      <FadeIn>
        <h2 className="font-mega text-[clamp(2rem,4.4vw,3.4rem)] leading-none text-fg">
          <SplitText text={"Подобни\nавтомобили"} />
        </h2>
      </FadeIn>
      <div className="mt-12 grid grid-cols-1 gap-x-8 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
        {vehicles.map((v, i) => (
          <FadeIn key={v.id} delay={i * 0.08} y={28}>
            <VehicleCard vehicle={v} />
          </FadeIn>
        ))}
      </div>
    </div>
  );
}
