import { IsInt, IsString, Length, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateGroupDto {
  @ApiProperty({
    description: '새로운 그룹 이름 (2~10자, 특수문자 제외)',
    example: '새로운그룹명',
  })
  @IsString()
  @Length(2, 10, { message: '그룹 이름은 2자 이상 10자 이하이어야 합니다.' })
  @Matches(/^[a-zA-Z0-9가-힣\s]+$/, {
    message: '그룹 이름은 한글, 영문, 숫자, 공백만 허용됩니다.',
  })
  name: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  version: number;
}
