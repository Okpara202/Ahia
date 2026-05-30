import { Typography } from "@/components/Typography";

interface AuthCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function AuthCard({ title, subtitle, children, footer }: AuthCardProps) {
  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Typography variant="heading-h2">{title}</Typography>
        {subtitle && (
          <Typography variant="body-md" className="text-muted-foreground">
            {subtitle}
          </Typography>
        )}
      </div>
      {children}
      {footer && (
        <div className="border-t border-border pt-5 text-center">{footer}</div>
      )}
    </div>
  );
}
