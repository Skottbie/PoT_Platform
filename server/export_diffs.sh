#!/bin/bash

file_path="./commit.hashes.txt"
commit_hashes=$(git log --pretty=format:%H -- $file_path)

# 将哈希值转换为数组，以便于访问
commit_array=($commit_hashes)

# 创建一个文件来存储所有的差异记录
output_file="all_diffs_for_$(basename $file_path).patch"
echo "" > $output_file

# 循环遍历除了最后一个提交以外的所有提交
for ((i = 0; i < ${#commit_array[@]}-1; i++)); do
  commit1=${commit_array[$i+1]}
  commit2=${commit_array[$i]}

  echo "--- Diff between $commit1 and $commit2 ---" >> $output_file

  # 使用 git diff 导出差异
  # `HEAD^` 这种语法更简洁
  git diff $commit1 $commit2 -- $file_path >> $output_file
  echo "" >> $output_file # 添加空行以分隔每个差异块
done

echo "所有提交差异已导出到 $output_file"