"use client";
import Avatar from "../atoms/Avatar";
import Button from "../atoms/Button";
import { useLocale } from "../../i18n/LocaleProvider";

interface ProfileHeaderProps {
  name: string;
  surname: string;
  email: string;
  avatar: string;
  onAvatarClick: () => void;
  saveDisabled?: boolean;
  saveLabel?: string;
}

export default function ProfileHeader({
  name,
  surname,
  email,
  avatar,
  onAvatarClick,
  saveDisabled,
  saveLabel,
}: ProfileHeaderProps) {
  const { t } = useLocale();
  return (
    <div className="flex items-center justify-between">
      {/* Left side */}
      <div className="flex items-center gap-5">
        <Avatar src={avatar} onClick={onAvatarClick} />
        <div>
          <p className="text-2xl font-semibold">
            {name} {surname}
          </p>
          <p className="text-sm sort-label opacity-[70%]">{email}</p>
        </div>
      </div>

      {/* Right side */}
      <div className="flex justify-end">
        <Button
          type="submit"
          variant="submit"
          className="py-2 px-4 w-auto disabled:opacity-60 disabled:cursor-not-allowed"
          disabled={saveDisabled}
        >
          {saveLabel ?? t("common.saveChanges")}
        </Button>
      </div>
    </div>
  );
}
