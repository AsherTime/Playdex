import { NextResponse } from "next/server";
import { getGuideEquipmentDetails } from "@/lib/guides/equipment-details";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ kind: string; id: string }> },
) {
  const { kind, id } = await params;
  if ((kind !== "equipment" && kind !== "set") || !id) {
    return NextResponse.json({ error: "Invalid equipment request." }, { status: 400 });
  }

  const details = await getGuideEquipmentDetails(kind, id);
  if (!details) {
    return NextResponse.json({ error: "Equipment not found." }, { status: 404 });
  }

  return NextResponse.json(details, {
    headers: {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
