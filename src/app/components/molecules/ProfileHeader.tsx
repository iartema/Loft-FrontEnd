"use client";
import Avatar from "../atoms/Avatar";
import Button from "../atoms/Button";

interface ProfileHeaderProps {
  name: string;
  surname: string;
  email: string;
  avatar: string;
  onAvatarClick: () => void;
}

export default function ProfileHeader({
  name,
  surname,
  email,
  avatar,
  onAvatarClick,
}: ProfileHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      {/* Left side */}
      <div className="flex items-center gap-5">
        <Avatar src={avatar} onClick={onAvatarClick} />
        <div>
          <p className="text-2xl font-semibold">
            {name} {surname}
          </p>
          <p className="text-sm text-gray-400">{email}</p>
        </div>
      </div>

      {/* Right side */}
      <div className="flex justify-end">
        <Button type="submit" variant="submit" className="py-2 px-4 w-auto">
          Save changes
        </Button>
      </div>
    </div>
  );
}
