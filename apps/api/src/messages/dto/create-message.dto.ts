import { IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class CreateMessageDto {
  @IsString()
  @MinLength(1, { message: "El mensaje no puede estar vacío" })
  @MaxLength(2000)
  body!: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  senderName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  deviceId?: string;
}
