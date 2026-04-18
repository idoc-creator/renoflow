import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const upc = searchParams.get("upc");

  if (!upc) {
    return Response.json({ error: "upc param required" }, { status: 400 });
  }

  try {
    // UPCitemdb trial API — free, no key, 100 calls/day
    const res = await fetch(
      `https://api.upcitemdb.com/prod/trial/lookup?upc=${encodeURIComponent(upc)}`,
      {
        headers: { Accept: "application/json" },
      }
    );

    if (!res.ok) {
      return Response.json(
        { error: "UPC lookup failed. Try again or add manually." },
        { status: 502 }
      );
    }

    const data = await res.json();

    if (!data.items || data.items.length === 0) {
      return Response.json({ found: false });
    }

    const item = data.items[0];
    return Response.json({
      found: true,
      name: item.title || null,
      brand: item.brand || null,
      description: item.description || null,
      image: item.images?.[0] || null,
    });
  } catch (error) {
    console.error("UPC lookup error:", error);
    return Response.json(
      { error: "UPC lookup failed." },
      { status: 500 }
    );
  }
}
