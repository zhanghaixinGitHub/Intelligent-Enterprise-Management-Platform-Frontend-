import type { UserMenu } from "../types/auth";

const cloneMenuTree = (menus: UserMenu[]): UserMenu[] => {
  return menus
    .map((menu) => ({
      ...menu,
      children: menu.children ? cloneMenuTree(menu.children) : []
    }))
    .sort((left, right) => left.order - right.order);
};

export const normalizeMenuTree = (menus: UserMenu[]): UserMenu[] => cloneMenuTree(menus);

export const flattenMenus = (menus: UserMenu[]): UserMenu[] => {
  const flattened: UserMenu[] = [];
  menus.forEach((menu) => {
    flattened.push(menu);
    if (menu.children?.length) {
      flattened.push(...flattenMenus(menu.children));
    }
  });
  return flattened;
};

export const hasMenuKey = (menus: UserMenu[], targetKey: string): boolean => {
  return menus.some((menu) => menu.key === targetKey || (menu.children?.length ? hasMenuKey(menu.children, targetKey) : false));
};

export const findMenuByKey = (menus: UserMenu[], targetKey: string): UserMenu | undefined => {
  for (const menu of menus) {
    if (menu.key === targetKey) {
      return menu;
    }
    if (menu.children?.length) {
      const matchedChild = findMenuByKey(menu.children, targetKey);
      if (matchedChild) {
        return matchedChild;
      }
    }
  }
  return undefined;
};

const isPathMatched = (candidatePath: string, currentPath: string) => {
  if (!candidatePath) {
    return false;
  }
  return currentPath === candidatePath || currentPath.startsWith(`${candidatePath}/`);
};

export const findMenuTrailByPath = (menus: UserMenu[], currentPath: string): UserMenu[] => {
  for (const menu of menus) {
    if (menu.children?.length) {
      const childTrail = findMenuTrailByPath(menu.children, currentPath);
      if (childTrail.length > 0) {
        return [menu, ...childTrail];
      }
    }

    if (isPathMatched(menu.path, currentPath)) {
      return [menu];
    }
  }
  return [];
};

export const resolveFirstLeafPath = (menus: UserMenu[]): string => {
  for (const menu of menus) {
    if (menu.children?.length) {
      const childPath = resolveFirstLeafPath(menu.children);
      if (childPath) {
        return childPath;
      }
    }

    if (menu.path) {
      return menu.path;
    }
  }
  return "/403";
};

