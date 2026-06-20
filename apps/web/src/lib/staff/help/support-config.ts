export interface StaffSupportContact {
  phone?: string;
  email?: string;
}

export interface StaffSupportConfig {
  ict: StaffSupportContact;
  cms: StaffSupportContact;
  program: StaffSupportContact;
}

function readEnv(key: string): string | undefined {
  const value = process.env[key]?.trim();
  return value || undefined;
}

/** Staff-only support contacts (not the public contact form). */
export function getStaffSupportConfig(): StaffSupportConfig {
  return {
    ict: {
      phone: readEnv("NEXT_PUBLIC_STAFF_SUPPORT_ICT_PHONE") ?? "+251 11 122 8200",
      email: readEnv("NEXT_PUBLIC_STAFF_SUPPORT_ICT_EMAIL") ?? "ict-help@mopd.gov.et",
    },
    cms: {
      phone: readEnv("NEXT_PUBLIC_STAFF_SUPPORT_CMS_PHONE") ?? "+251 11 122 8215",
      email: readEnv("NEXT_PUBLIC_STAFF_SUPPORT_CMS_EMAIL") ?? "cms-support@mopd.gov.et",
    },
    program: {
      phone: readEnv("NEXT_PUBLIC_STAFF_SUPPORT_PROGRAM_PHONE"),
      email:
        readEnv("NEXT_PUBLIC_STAFF_SUPPORT_PROGRAM_EMAIL") ?? "cms-program@mopd.gov.et",
    },
  };
}

export function staffApiDocsUrl(): string {
  const fromPath = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/$/, "");
  if (fromPath?.endsWith("/api/v1")) {
    const origin = fromPath.replace(/\/api\/v1$/, "");
    return `${origin}/api/docs`;
  }
  const host = process.env.NEXT_PUBLIC_API_BASE_URL?.trim().replace(/\/$/, "");
  if (host) {
    return `${host}/api/docs`;
  }
  return "http://localhost:3001/api/docs";
}
