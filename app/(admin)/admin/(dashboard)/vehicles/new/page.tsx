import { createDraftVehicle } from "@/lib/admin/vehicle-actions";

// Creates (or reuses) a blank draft and redirects into the editor.
export default async function NewVehiclePage() {
  await createDraftVehicle();
  return null;
}
