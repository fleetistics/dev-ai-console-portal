export enum MediaType {
    Image = 1,
    Video = 2,
    Sound = 3,
    File = 4,
};

export type UploadedMedia = {
    Id: number;
    Url?: string;
    PreviewUrl?: string;
    MediaType: number; 
};