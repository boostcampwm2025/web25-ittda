import { IsString, Length, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateGroupDto {
  @ApiProperty({
    description: '그룹 이름 (2~30자, 특수문자 제외)',
    example: '우리들의 여름 추억',
  })
  @IsString()
  @Length(2, 30, { message: '그룹 이름은 2자 이상 30자 이하이어야 합니다.' })
  @Matches(/^[a-zA-Z0-9가-힣\s]+$/, {
    message: '그룹 이름은 한글, 영문, 숫자, 공백만 허용됩니다.',
  })
  name: string;
}
