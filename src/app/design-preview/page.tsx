import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

/**
 * TEMPORARY — Phase 1 design-system preview (Warm Paper).
 * View at /design-preview on desktop and at 390px. Remove after sign-off.
 */
export default function DesignPreview() {
  return (
    <div className="min-h-dvh bg-background px-5 py-10 text-foreground md:px-10">
      <div className="mx-auto max-w-3xl space-y-10">
        <header>
          <p className="font-mono text-xs uppercase tracking-widest text-mut">
            // PHASE 1 · DESIGN TOKENS
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">
            Warm Paper — base components
          </h1>
          <p className="mt-2 font-mono text-sm text-mut">
            Inter body · JetBrains Mono data · beige surface · white cards
          </p>
        </header>

        {/* Buttons */}
        <section className="space-y-3">
          <h2 className="font-mono text-[11px] font-bold uppercase tracking-wider text-mut-2">
            // BUTTON
          </h2>
          <div className="flex flex-wrap items-center gap-3">
            <Button>Үндсэн (ink)</Button>
            <Button variant="brand">Бренд (green)</Button>
            <Button variant="secondary">Хоёрдогч</Button>
            <Button variant="outline">Контур</Button>
            <Button variant="ghost">Сүүдэр</Button>
            <Button variant="destructive">Устгах</Button>
            <Button variant="link">Холбоос</Button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button size="sm">Жижиг</Button>
            <Button>Дунд</Button>
            <Button size="lg">Том</Button>
          </div>
        </section>

        {/* Badges */}
        <section className="space-y-3">
          <h2 className="font-mono text-[11px] font-bold uppercase tracking-wider text-mut-2">
            // BADGE
          </h2>
          <div className="flex flex-wrap items-center gap-3">
            <Badge>Үндсэн</Badge>
            <Badge variant="secondary">Хоёрдогч</Badge>
            <Badge variant="outline">Контур</Badge>
            <Badge variant="destructive">Аюул</Badge>
            {/* Soft status chips from the new tokens (mono) */}
            <span className="inline-flex items-center gap-1.5 rounded-md bg-success-soft px-2 py-0.5 font-mono text-[11px] font-bold text-success">
              <span className="size-1.5 rounded-full bg-success" />
              LIVE · 2с
            </span>
            <span className="rounded-md bg-amber-soft px-2 py-0.5 font-mono text-[11px] font-bold text-amber">
              АНХААР
            </span>
            <span className="rounded-md bg-danger-soft px-2 py-0.5 font-mono text-[11px] font-bold text-danger">
              БЭЛЧЭЭР ДАВСАН
            </span>
            <span className="rounded-md bg-info-soft px-2 py-0.5 font-mono text-[11px] font-bold text-info">
              МЭДЭЭЛЭЛ
            </span>
          </div>
        </section>

        {/* Inputs */}
        <section className="space-y-3">
          <h2 className="font-mono text-[11px] font-bold uppercase tracking-wider text-mut-2">
            // INPUT
          </h2>
          <div className="grid max-w-md gap-3">
            <Input placeholder="Хайх…" />
            <Input className="font-mono" placeholder="+976 9911-4488" />
          </div>
        </section>

        {/* Card */}
        <section className="space-y-3">
          <h2 className="font-mono text-[11px] font-bold uppercase tracking-wider text-mut-2">
            // CARD
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Хайнаг · A-047</CardTitle>
                <CardDescription className="font-mono">
                  Сүүлд: 2 мин · 1.4 км
                </CardDescription>
              </CardHeader>
              <CardContent className="flex items-center gap-2">
                <Badge variant="secondary">Сүрэг</Badge>
                <span className="rounded-md bg-danger-soft px-2 py-0.5 font-mono text-[11px] font-bold text-danger">
                  БЭЛЧЭЭР ДАВСАН
                </span>
              </CardContent>
              <CardFooter className="gap-2">
                <Button size="sm">Үзэх</Button>
                <Button size="sm" variant="outline">
                  Газрын зураг
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Метрик</CardTitle>
                <CardDescription className="font-mono">
                  Mono тоон утга
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <div className="font-mono text-2xl font-bold text-danger">
                      4
                    </div>
                    <div className="font-mono text-[10px] uppercase text-mut">
                      Гарсан
                    </div>
                  </div>
                  <div>
                    <div className="font-mono text-2xl font-bold text-amber">
                      3
                    </div>
                    <div className="font-mono text-[10px] uppercase text-mut">
                      Анхаар
                    </div>
                  </div>
                  <div>
                    <div className="font-mono text-2xl font-bold text-success">
                      3
                    </div>
                    <div className="font-mono text-[10px] uppercase text-mut">
                      Аюулгүй
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
}
