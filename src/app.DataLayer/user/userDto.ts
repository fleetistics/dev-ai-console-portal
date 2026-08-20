import { UploadedMedia } from "../media/uploadedMedia";

export type User = {
    Id: number,
    DisplayName: string,
    FullName: string,
    Phone: string,
    Email: string,
    AvatarImage?: UploadedMedia
};

export type NewUser = {
    UserName: string,
    DisplayName: string,
    FullName: string,
    Phone: string,
    Email: string
};