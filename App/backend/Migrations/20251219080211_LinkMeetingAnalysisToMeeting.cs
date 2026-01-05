using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class LinkMeetingAnalysisToMeeting : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "MeetingId",
                table: "MeetingAnalyses",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_MeetingAnalyses_MeetingId",
                table: "MeetingAnalyses",
                column: "MeetingId");

            migrationBuilder.AddForeignKey(
                name: "FK_MeetingAnalyses_Meetings_MeetingId",
                table: "MeetingAnalyses",
                column: "MeetingId",
                principalTable: "Meetings",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_MeetingAnalyses_Meetings_MeetingId",
                table: "MeetingAnalyses");

            migrationBuilder.DropIndex(
                name: "IX_MeetingAnalyses_MeetingId",
                table: "MeetingAnalyses");

            migrationBuilder.DropColumn(
                name: "MeetingId",
                table: "MeetingAnalyses");
        }
    }
}
