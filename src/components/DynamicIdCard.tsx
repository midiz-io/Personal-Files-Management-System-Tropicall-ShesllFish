import React from "react";
import { IdCardTemplateConfig } from "@/lib/id-card-template";
import localFallbackLogo from "@/assets/employee-files-logo.webp";

interface DynamicIdCardProps {
  emp: {
    id: string;
    employee_code?: string | null;
    full_name?: string | null;
    nic?: string | null;
    designation?: string | null;
    department?: string | null;
    date_of_birth?: string | null;
    gender?: string | null;
    phone?: string | null;
    emergency_contact_phone?: string | null;
    created_at?: string | null;
    approved_at?: string | null;
    photo_url?: string | null;
    signature_url?: string | null;
  };
  template: IdCardTemplateConfig;
  qrUrl?: string | null;
  cardRef?: React.RefObject<HTMLDivElement>;
  className?: string;
}

export const DynamicIdCard: React.FC<DynamicIdCardProps> = ({
  emp,
  template,
  qrUrl,
  cardRef,
  className = "",
}) => {
  const getHeaderBackground = () => {
    if (template.headerStyle === "solid") {
      return template.headerBgColor;
    }
    return `linear-gradient(135deg, ${template.headerBgColor} 0%, ${template.headerGradientEnd} 100%)`;
  };

  const getCardBackground = () => {
    if (template.cardBgType === "solid") {
      return template.cardBgStart;
    }
    return `linear-gradient(135deg, ${template.cardBgStart} 0%, ${template.cardBgEnd} 100%)`;
  };

  const getLogoRadius = () => {
    switch (template.logoShape) {
      case "circle":
        return "9999px";
      case "square":
        return "2px";
      case "rounded":
      default:
        return "10px";
    }
  };

  const getPhotoRadius = () => {
    switch (template.photoShape) {
      case "circle":
        return "9999px";
      case "square":
        return "2px";
      case "rounded":
      default:
        return "8px";
    }
  };

  const formatRegisteredDate = (dateStr?: string | null) => {
    if (!dateStr) return "";
    try {
      return new Date(dateStr).toLocaleDateString();
    } catch {
      return dateStr;
    }
  };

  const empNumber = emp.employee_code || emp.id?.slice(0, 8).toUpperCase() || "EMP-001";

  return (
    <div
      ref={cardRef}
      className={`shadow-2xl overflow-hidden print:shadow-none min-w-[560px] max-w-[660px] w-full text-foreground transition-all duration-200 select-none ${className}`}
      style={{
        border: `${template.borderWidth}px solid ${template.borderColor}`,
        borderRadius: `${template.borderRadius}px`,
        background: getCardBackground(),
      }}
    >
      {/* 1. Header Banner */}
      <div
        className="px-5 py-3 flex items-center justify-between"
        style={{
          background: getHeaderBackground(),
          color: template.headerTextColor,
        }}
      >
        <div className="flex items-center gap-3">
          {template.showLogo && (
            <img
              src={template.logoUrl || localFallbackLogo}
              crossOrigin="anonymous"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = localFallbackLogo;
              }}
              alt="Logo"
              style={{
                width: `${template.logoSize}px`,
                height: `${template.logoSize}px`,
                borderRadius: getLogoRadius(),
                objectFit: "cover",
                border: "2px solid rgba(255,255,255,0.4)",
              }}
            />
          )}
          <div>
            <div className="font-bold text-sm sm:text-base leading-tight tracking-wide">
              {template.headerTitle}
            </div>
            <div className="text-[10px] sm:text-xs opacity-90 font-medium tracking-wider">
              {template.headerSubtitle}
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className="text-[10px] opacity-80 uppercase tracking-wider font-semibold">
            {template.idNumberPrefix}
          </div>
          <div className="font-mono font-bold text-sm tracking-widest">{empNumber}</div>
        </div>
      </div>

      {/* 2. Main Body with Holder Photo & Fields */}
      <div
        className="p-5 sm:p-6 grid grid-cols-3 gap-5"
        style={{
          backgroundColor: `rgba(255, 255, 255, ${template.bodyBgOpacity / 100})`,
        }}
      >
        {/* Photo Container */}
        <div className="col-span-1 flex flex-col items-center justify-start gap-2">
          {emp.photo_url ? (
            <img
              src={emp.photo_url}
              crossOrigin="anonymous"
              alt={emp.full_name || "Employee"}
              className="w-32 h-40 object-cover shadow-sm"
              style={{
                borderRadius: getPhotoRadius(),
                border: `${template.photoBorderWidth}px solid ${template.photoBorderColor}`,
              }}
            />
          ) : (
            <div
              className="w-32 h-40 bg-muted/60 flex flex-col items-center justify-center text-center p-2 border-dashed shadow-inner"
              style={{
                borderRadius: getPhotoRadius(),
                border: `${template.photoBorderWidth}px solid ${template.photoBorderColor}66`,
              }}
            >
              <span className="text-xs text-muted-foreground font-medium">
                {template.photoPlaceholderText}
              </span>
            </div>
          )}
          <div className="text-[10px] text-muted-foreground italic tracking-wide">
            {template.photoPlaceholderText}
          </div>
        </div>

        {/* Dynamic Fields */}
        <div className="col-span-2 space-y-2 text-sm justify-center flex flex-col">
          {template.showFullName && (
            <FieldRow
              accentColor={template.accentColor}
              label={template.fullNameLabel}
              value={emp.full_name}
            />
          )}
          {template.showNic && (
            <FieldRow
              accentColor={template.accentColor}
              label={template.nicLabel}
              value={emp.nic}
            />
          )}
          {template.showDesignation && (
            <FieldRow
              accentColor={template.accentColor}
              label={template.designationLabel}
              value={emp.designation}
            />
          )}
          {template.showDepartment && (
            <FieldRow
              accentColor={template.accentColor}
              label={template.departmentLabel}
              value={emp.department}
            />
          )}
          {template.showDob && (
            <FieldRow
              accentColor={template.accentColor}
              label={template.dobLabel}
              value={emp.date_of_birth}
            />
          )}
          {template.showGender && (
            <FieldRow
              accentColor={template.accentColor}
              label={template.genderLabel}
              value={emp.gender}
            />
          )}
          {template.showPhone && (
            <FieldRow
              accentColor={template.accentColor}
              label={template.phoneLabel}
              value={emp.phone}
            />
          )}
          {template.showEmergencyPhone && (
            <FieldRow
              accentColor={template.accentColor}
              label={template.emergencyPhoneLabel}
              value={emp.emergency_contact_phone}
            />
          )}
          {template.showRegisteredDate && (
            <FieldRow
              accentColor={template.accentColor}
              label={template.registeredDateLabel}
              value={formatRegisteredDate(emp.created_at)}
            />
          )}
        </div>
      </div>

      {/* 3. Footer Block */}
      <div
        className="border-t p-5 grid grid-cols-3 gap-4 items-end"
        style={{
          borderColor: `${template.borderColor}33`,
          backgroundColor: "rgba(255, 255, 255, 0.85)",
        }}
      >
        {/* Issue Details */}
        <div>
          <div className="text-[10px] text-muted-foreground uppercase font-semibold">
            {template.issueDateLabel}
          </div>
          <div className="font-semibold text-sm">
            {emp.approved_at ? new Date(emp.approved_at).toLocaleDateString() : "—"}
          </div>
          <div className="text-[10px] text-muted-foreground uppercase font-semibold mt-2">
            Place of Issue
          </div>
          <div className="font-medium text-xs sm:text-sm">{template.placeOfIssue}</div>
        </div>

        {/* QR Code Section */}
        <div className="flex flex-col items-center">
          {template.showQr && qrUrl ? (
            <img
              src={qrUrl}
              alt="Verification QR"
              className="w-24 h-24 sm:w-28 sm:h-28 border rounded bg-white p-1 shadow-sm"
              style={{ borderColor: `${template.accentColor}40` }}
            />
          ) : template.showQr ? (
            <div className="w-24 h-24 sm:w-28 sm:h-28 border border-dashed rounded bg-muted/40 flex items-center justify-center text-[10px] text-muted-foreground text-center p-1">
              QR Code Preview
            </div>
          ) : null}
          {template.showQr && (
            <div className="text-[9px] text-muted-foreground mt-1 font-medium">
              {template.qrLabel}
            </div>
          )}
        </div>

        {/* Signatory Authority */}
        <div className="text-center flex flex-col items-center">
          {template.showSignature && (
            <>
              {template.signatureUrl ? (
                <img
                  src={template.signatureUrl}
                  crossOrigin="anonymous"
                  alt="Signature"
                  className="h-10 mx-auto object-contain"
                />
              ) : emp.signature_url ? (
                <img
                  src={emp.signature_url}
                  crossOrigin="anonymous"
                  alt="Signature"
                  className="h-10 mx-auto object-contain"
                />
              ) : (
                <div
                  className="h-9 w-28 mx-auto border-b-2 flex items-end justify-center pb-0.5"
                  style={{ borderColor: `${template.accentColor}80` }}
                >
                  <span className="text-[10px] italic text-muted-foreground font-serif">
                    Approved
                  </span>
                </div>
              )}
              <div className="text-[10px] font-semibold text-foreground mt-1 leading-tight">
                {template.signatoryTitle}
              </div>
              <div className="text-[9px] text-muted-foreground italic leading-tight">
                {template.signatoryOrg}
              </div>
            </>
          )}
        </div>
      </div>

      {/* 4. Bottom Disclaimer Banner */}
      {template.showDisclaimer && (
        <div
          className="text-[10px] text-center py-1.5 px-3 font-medium tracking-wide"
          style={{
            background: template.disclaimerBgColor,
            color: template.disclaimerTextColor,
          }}
        >
          {template.disclaimerText}
        </div>
      )}
    </div>
  );
};

function FieldRow({
  label,
  value,
  accentColor,
}: {
  label: string;
  value?: string | null;
  accentColor: string;
}) {
  return (
    <div
      className="grid grid-cols-3 gap-2 pb-1 text-xs sm:text-sm"
      style={{
        borderBottom: `1px solid ${accentColor}25`,
      }}
    >
      <span className="text-muted-foreground font-medium col-span-1">{label}</span>
      <span className="col-span-2 font-semibold text-foreground truncate">{value || "—"}</span>
    </div>
  );
}
