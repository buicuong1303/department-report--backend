import { IsString, MinLength, MaxLength, Matches } from 'class-validator';
export class ResetPasswordDto {
  @IsString()
  @MinLength(8)
  @MaxLength(20)
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'password to weak',
  })
  password: string;
}
