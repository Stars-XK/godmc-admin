import { Injectable } from '@nestjs/common';
import { ResultData } from '@app/common/utils/result';
import { MenuService } from '../system/menu/menu.service';

@Injectable()
export class MainService {
  constructor(
    private readonly menuService: MenuService,
  ) {}

  /**
   * 获取路由菜单
   */
  async getRouters(userId: number) {
    const menus = await this.menuService.getMenuListByUserId(userId);
    return ResultData.ok(menus);
  }
}
