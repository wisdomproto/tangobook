import type { Request, Response, NextFunction } from 'express';
import {
  listMembers,
  getMemberDetail,
  grantMember,
  setMemberBan,
  deleteMember,
} from '../services/members.service.js';
import type { GrantInput } from '../services/members-grant.js';

export const MembersController = {
  async list(_req: Request, res: Response, next: NextFunction) {
    try {
      res.json({ success: true, data: await listMembers() });
    } catch (err) {
      next(err);
    }
  },
  async detail(req: Request, res: Response, next: NextFunction) {
    try {
      res.json({ success: true, data: await getMemberDetail(req.params.accountId as string) });
    } catch (err) {
      next(err);
    }
  },
  async grant(req: Request, res: Response, next: NextFunction) {
    try {
      await grantMember(req.params.accountId as string, req.body as GrantInput);
      res.json({ success: true, data: { ok: true } });
    } catch (err) {
      next(err);
    }
  },
  async ban(req: Request, res: Response, next: NextFunction) {
    try {
      await setMemberBan(
        req.params.accountId as string,
        !!(req.body as { banned?: boolean }).banned
      );
      res.json({ success: true, data: { ok: true } });
    } catch (err) {
      next(err);
    }
  },
  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await deleteMember(req.params.accountId as string);
      res.json({ success: true, data: { ok: true } });
    } catch (err) {
      next(err);
    }
  },
};
