import { intersection } from 'lodash';

export const validatePermission = (
  listPermissionOfUser = [],
  requestListPermission = [],
) => {
  if (requestListPermission[0] === 'or') {
    for (let i = 1; i < requestListPermission.length; i++) {
      if (listPermissionOfUser.indexOf(requestListPermission[i]) !== -1) {
        return false;
      }
    }
    return true;
  }

  //* neu khong du quyen return true
  return (
    intersection(listPermissionOfUser, requestListPermission)
      .sort()
      .toString()
      .replace(/[,]+/g, '') !==
    requestListPermission
      .sort()
      .toString()
      .replace(/[,]+/g, '')
  );
};
