-- チャンネルの所有者のみが更新できるポリシー
CREATE POLICY "Channel owners can update their channels" 
  ON channels 
  FOR UPDATE 
  USING (auth.uid() = owner_id);