# frozen_string_literal: true
# == Schema Information
#
# Table name: account_custom_colors
#
#  id         :integer          not null, primary key
#  account_id :integer          not null
#  textcolor  :integer          default(3223857), not null
#  linkcolor  :integer          default(10197915), not null
#  linkcolor2 :integer          default(2397659), not null
#  strong1    :integer          default(13632027), not null
#  strong2    :integer          default(0), not null
#  color1     :integer          default(16777215), not null
#  color2     :integer          default(15987699), not null
#  color3     :integer          default(13684944), not null
#

class AccountCustomColor < ApplicationRecord
  belongs_to :account, required: true
end
