import { ThemeSwitcher } from "@/components/settings/ThemeSwitcher";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

/**
 * Temporary theme-preview page. M1+M2 proof-of-life.
 * Replaced by the real Dashboard at M6 — kept here so /
 * exercises all 3 theme tokens against shadcn primitives.
 */
export default function Home() {
  return (
    <main className="mx-auto w-full max-w-[420px] min-h-dvh pt-safe pb-safe px-5 py-6 space-y-6">
      <header className="space-y-1">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          Малчин · GPS хяналт
        </p>
        <h1 className="font-display text-3xl leading-tight">
          Загвар туршилт
        </h1>
        <p className="text-sm text-muted-foreground">
          Гурван загварыг доороос сонгож, бүх элементийг шууд харна уу.
        </p>
      </header>

      <section aria-label="Загвар сонгох">
        <h2 className="font-display text-lg mb-3">Загвар</h2>
        <ThemeSwitcher />
      </section>

      <section aria-label="Жишээ элементүүд" className="space-y-3">
        <h2 className="font-display text-lg">Жишээ элементүүд</h2>

        <Card
          className="border-card"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <CardHeader>
            <CardTitle className="font-display">Хонгор · A-014</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className="bg-success text-success-foreground">
                Аюулгүй
              </Badge>
              <Badge className="bg-warning text-warning-foreground">
                Анхааруулга
              </Badge>
              <Badge className="bg-destructive text-destructive-foreground">
                Хязгаар давсан
              </Badge>
            </div>
            <Input
              placeholder="Малын дугаар хайх…"
              className="tap"
              inputMode="search"
            />
            <div className="flex gap-2">
              <Button className="tap flex-1">Үндсэн үйлдэл</Button>
              <Button variant="secondary" className="tap flex-1">
                Хоёрдогч
              </Button>
            </div>
            <Button variant="outline" className="tap w-full">
              Зураг дээр харах
            </Button>
          </CardContent>
        </Card>

        <div
          aria-hidden
          className="pattern-band h-3 rounded-sm"
          title="Монгол хээ — зөвхөн нүүдэлчин загварт"
        />
      </section>

      <footer className="text-xs text-muted-foreground pt-2">
        v0.0.1 · MVP scaffold
      </footer>
    </main>
  );
}
