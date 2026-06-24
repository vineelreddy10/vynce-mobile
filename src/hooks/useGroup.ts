import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listGroups,
  getGroupDetails,
  joinGroup,
  leaveGroup,
  type Group,
  type GroupDetail,
} from "../api/group";

export function useListGroups(category?: string, page: number = 1, pageSize: number = 20) {
  return useQuery({
    queryKey: ["groups", { category, page, pageSize }],
    queryFn: () => listGroups(category, page, pageSize),
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

export function useJoinGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: joinGroup,
    onMutate: async (groupName) => {
      await qc.cancelQueries({ queryKey: ["groups"] });
      const previousData = qc.getQueriesData<Group[]>({ queryKey: ["groups"] });
      const previousDetail = qc.getQueryData<GroupDetail>(["groupDetails", groupName]);

      qc.setQueriesData<Group[]>({ queryKey: ["groups"] }, (old) =>
        old
          ? old.map((g) =>
              g.group_name === groupName ? { ...g, is_member: true, member_count: g.member_count + 1 } : g
            )
          : old
      );

      if (previousDetail) {
        qc.setQueryData(["groupDetails", groupName], {
          ...previousDetail,
          is_member: true,
          member_count: previousDetail.member_count + 1,
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
