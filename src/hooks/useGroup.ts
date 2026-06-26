import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listGroups,
  getGroupDetails,
  joinGroup,
  leaveGroup,
  createGroup,
  getJoinRequests,
  approveJoinRequest,
  rejectJoinRequest,
  removeMember,
  transferAdmin,
  createGroupPost,
  getGroupPosts,
  sendMatchRequest,
  type Group,
  type GroupDetail,
} from "../api/group";

export function useListGroups(category?: string, page: number = 1, pageSize: number = 20, search?: string) {
  return useQuery({
    queryKey: ["groups", { category, page, pageSize, search }],
    queryFn: async () => {
      const res = await listGroups(category, page, pageSize, search);
      return res.groups ?? [];
    },
    staleTime: 30_000,
  });
}

export function useGroupDetails(groupName: string) {
  return useQuery({
    queryKey: ["groupDetails", groupName],
    queryFn: () => getGroupDetails(groupName),
    enabled: !!groupName,
    staleTime: 15_000,
  });
}

export function useCreateGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createGroup,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["groups"] });
    },
  });
}

export function useJoinGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: joinGroup,
    onMutate: async (groupName) => {
      await qc.cancelQueries({ queryKey: ["groups"] });
      return { groupName };
    },
    onError: (_err, groupName) => {
      qc.invalidateQueries({ queryKey: ["groups"] });
      qc.invalidateQueries({ queryKey: ["groupDetails", groupName] });
    },
    onSettled: (_data, _err, groupName) => {
      qc.invalidateQueries({ queryKey: ["groups"] });
      qc.invalidateQueries({ queryKey: ["groupDetails", groupName] });
    },
  });
}

export function useLeaveGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: leaveGroup,
    onMutate: async (groupName) => {
      await qc.cancelQueries({ queryKey: ["groups"] });
      const previousData = qc.getQueriesData<Group[]>({ queryKey: ["groups"] });
      const previousDetail = qc.getQueryData<GroupDetail>(["groupDetails", groupName]);

      qc.setQueriesData<Group[]>({ queryKey: ["groups"] }, (old) =>
        old
          ? old.map((g) =>
              g.group_name === groupName ? { ...g, is_member: false, member_count: Math.max(0, g.member_count - 1) } : g
            )
          : old
      );

      if (previousDetail) {
        qc.setQueryData(["groupDetails", groupName], {
          ...previousDetail,
          is_member: false,
          member_count: Math.max(0, previousDetail.member_count - 1),
        });
      }

      return { previousData, previousDetail };
    },
    onError: (_err, groupName, context) => {
      if (context?.previousData) {
        context.previousData.forEach(([key, data]) => qc.setQueryData(key, data));
      }
      if (context?.previousDetail) {
        qc.setQueryData(["groupDetails", groupName], context.previousDetail);
      }
    },
    onSettled: (_data, _err, groupName) => {
      qc.invalidateQueries({ queryKey: ["groups"] });
      qc.invalidateQueries({ queryKey: ["groupDetails", groupName] });
    },
  });
}

export function useJoinRequests(groupName: string) {
  return useQuery({
    queryKey: ["joinRequests", groupName],
    queryFn: () => getJoinRequests(groupName),
    enabled: !!groupName,
    staleTime: 10_000,
  });
}

export function useApproveJoinRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: approveJoinRequest,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["joinRequests"] });
      qc.invalidateQueries({ queryKey: ["groupDetails"] });
      qc.invalidateQueries({ queryKey: ["groups"] });
    },
  });
}

export function useRejectJoinRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: rejectJoinRequest,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["joinRequests"] });
    },
  });
}

export function useRemoveMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ groupName, targetUser }: { groupName: string; targetUser: string }) =>
      removeMember(groupName, targetUser),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["groupDetails"] });
      qc.invalidateQueries({ queryKey: ["groups"] });
    },
  });
}

export function useTransferAdmin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ groupName, targetUser }: { groupName: string; targetUser: string }) =>
      transferAdmin(groupName, targetUser),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["groupDetails"] });
    },
  });
}

export function useCreateGroupPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ groupName, content, media, mediaType }: {
      groupName: string;
      content?: string;
      media?: string;
      mediaType?: string;
    }) => createGroupPost(groupName, content, media, mediaType),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["groupPosts", variables.groupName] });
    },
  });
}

export function useGroupPosts(groupName: string, page: number = 1, pageSize: number = 20) {
  return useQuery({
    queryKey: ["groupPosts", groupName, { page, pageSize }],
    queryFn: () => getGroupPosts(groupName, page, pageSize),
    enabled: !!groupName,
    staleTime: 15_000,
  });
}

export function useSendMatchRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ groupName, targetUser }: { groupName: string; targetUser: string }) =>
      sendMatchRequest(groupName, targetUser),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["matches"] });
    },
  });
}
