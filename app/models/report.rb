# frozen_string_literal: true
# == Schema Information
#
# Table name: reports
#
#  id                         :bigint(8)        not null, primary key
#  status_ids                 :bigint(8)        default([]), not null, is an Array
#  comment                    :text             default(""), not null
#  action_taken               :boolean          default(FALSE), not null
#  created_at                 :datetime         not null
#  updated_at                 :datetime         not null
#  account_id                 :bigint(8)        not null
#  action_taken_by_account_id :bigint(8)
#  target_account_id          :bigint(8)        not null
#  pawoo_report_type          :integer          default("other"), not null
#  assigned_account_id        :bigint(8)
#

class Report < ApplicationRecord
  belongs_to :account
  belongs_to :target_account, class_name: 'Account'
  belongs_to :action_taken_by_account, class_name: 'Account', optional: true
  belongs_to :assigned_account, class_name: 'Account', optional: true
  has_many :pawoo_report_targets, class_name: 'Pawoo::ReportTarget', inverse_of: :report

  enum pawoo_report_type: %i(other prohibited reproduction spam nsfw donotlike)

  has_many :notes, class_name: 'ReportNote', foreign_key: :report_id, inverse_of: :report, dependent: :destroy

  scope :unresolved, -> { where(action_taken: false) }
  scope :resolved,   -> { where(action_taken: true) }

  validates :comment, length: { maximum: 1000 }

  def object_type
    :flag
  end

  def statuses
    Status.where(id: status_ids).includes(:account, :media_attachments, :mentions)
  end

  def media_attachments
    MediaAttachment.where(status_id: status_ids)
  end

  def assign_to_self!(current_account)
    update!(assigned_account_id: current_account.id)
  end

  def unassign!
    update!(assigned_account_id: nil)
  end

  def resolve!(acting_account)
    update!(action_taken: true, action_taken_by_account_id: acting_account.id)
  end

  def unresolve!
    update!(action_taken: false, action_taken_by_account_id: nil)
  end

  def unresolved?
    !action_taken?
  end

  def history
    time_range = created_at..updated_at

    sql = [
      Admin::ActionLog.where(
        target_type: 'Report',
        target_id: id,
        created_at: time_range
      ).unscope(:order),

      Admin::ActionLog.where(
        target_type: 'Account',
        target_id: target_account_id,
        created_at: time_range
      ).unscope(:order),

      Admin::ActionLog.where(
        target_type: 'Status',
        target_id: status_ids,
        created_at: time_range
      ).unscope(:order),
    ].map { |query| "(#{query.to_sql})" }.join(' UNION ALL ')

    Admin::ActionLog.from("(#{sql}) AS admin_action_logs")
  end
end
