// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./Projects.sol";

contract Escrow {
    address public freelancer;
    address public employer;
    uint public amount;

    constructor(address _freelancer, address _employer) payable {
        freelancer = _freelancer;
        employer = _employer;
        amount = msg.value; // Set the amount to the value sent during the contract creation
    }

    function releaseFunds() external {
        require(msg.sender == employer, "Only the employer can release funds");
        require(amount > 0, "No funds to release");
        payable(freelancer).transfer(amount);
        amount = 0; // Set amount to 0 after release
    }

    function refund() external {
        require(msg.sender == freelancer, "Only the freelancer can request a refund");
        require(amount > 0, "No funds to refund");
        payable(freelancer).transfer(amount);
        amount = 0; // Set amount to 0 after refund
    }

    function releaseReducedFunds(uint _reducedAmount) external {
        require(msg.sender == employer, "Only the employer can release funds");
        require(amount > 0, "No funds to release");
        require(_reducedAmount <= amount, "Reduced amount exceeds escrow balance");

        payable(freelancer).transfer(_reducedAmount);
        amount -= _reducedAmount; // Deduct the paid amount from the total escrow balance
    }

    function releaseMilestonePayment(uint milestonePercentage) external {
        require(amount > 0, "Insufficient funds in escrow");

        uint milestonePayment = (amount * milestonePercentage) / 100;
        require(milestonePayment <= amount, "Milestone payment exceeds escrow balance");

        payable(freelancer).transfer(milestonePayment);
        // amount -= milestonePayment;
    }
}

contract RequestManager {
    Projects public projectsContract;

    enum RequestStatus { Pending, Accepted, Rejected }

    struct Request {
        uint projectId;
        address freelancer;
        uint freelancerRating;
        RequestStatus status;
        Escrow escrowContract;
    }

    struct MilestoneReviewRequest {
        uint id;
        uint milestoneId;
        address freelancer;
        string cid;
        bool reviewed;
    }

    struct File {
        uint id;
        uint milestoneId;
        string name;
        string rid;
        string cid;
    }

    struct ReviewResponse{
        uint id;
        uint milestoneId;
        address freelancer;
        string response;
        bool accepted;
    }
    
    struct RequestDraft {
        uint id;
        uint requestId;
        uint projectId;
        address freelancer;
        address employer;
        string draftContent; // Could be description or proposal
        uint timestamp;
        bool reviewed;
    }
    
    struct FreelancerRating {
        uint ratingId;
        uint requestId;
        address rater; // employer
        address freelancer;
        uint rating; // 1-5 stars
        string review;
        uint timestamp;
    }
    
    struct ProjectCompletion {
        uint completionId;
        uint projectId;
        uint requestId;
        address employer;
        address freelancer;
        bool isCompleted;
        uint completionTime;
    }
    
    mapping(uint => ReviewResponse) public reviewResponses;
    uint public responseCount;

    // Mapping milestone ID to an array of files
    mapping(uint => File[]) public milestoneFiles;
    uint public fileCount;

    // Store all requests in a single mapping
    mapping(uint => Request) public requests;
    uint public requestCount; // To keep track of the total number of requests

    mapping(uint => MilestoneReviewRequest) public milestoneReviewRequests;
    uint public milestoneReviewRequestCount;

    // New mappings for additional features
    mapping(uint => RequestDraft) public requestDrafts;
    uint public requestDraftCount;
    
    mapping(uint => FreelancerRating) public freelancerRatings;
    uint public freelancerRatingCount;
    
    mapping(uint => ProjectCompletion) public projectCompletions;
    uint public projectCompletionCount;
    
    mapping(address => uint[]) public freelancerRatingsList; // Track ratings per freelancer

    event RequestSent(uint requestId, uint projectId, address freelancer);
    event RequestAccepted(uint requestId, address freelancer, address escrowContract);
    event RequestRejected(uint requestId, address freelancer);
    event MilestoneReviewRequestSent(uint requestId, uint milestoneId, string cid);
    event MilestoneAccepted(uint projectId, uint milestoneId, uint updatedRating);
    event MilestoneReviewRequestRejected(uint indexed reviewRequestId, string reason);
    event RejectionReasonAccepted(uint _reviewRequestId);
    event RequestDraftSent(uint draftId, uint requestId, address freelancer, address employer);
    event FreelancerRatingSubmitted(uint ratingId, address rater, address freelancer, uint rating);
    event ProjectCompleted(uint projectId, uint requestId, address employer, address freelancer);

    constructor(address _projectsContract) {
        projectsContract = Projects(_projectsContract);
    }

    function sendRequest(uint _projectId, uint _freelancerRating) public {
        require(_projectId > 0 && _projectId <= projectsContract.projectCount(), "Invalid project ID");
        (,, , , Projects.Status status, ) = projectsContract.getProject(_projectId);
        require(status == Projects.Status.Open, "Project is not open");

        // Create a new request
        requestCount++; // Increment request count to create a unique ID
        requests[requestCount] = Request({
            projectId: _projectId,
            freelancer: msg.sender,
            freelancerRating: _freelancerRating,
            status: RequestStatus.Pending,
            escrowContract: Escrow(address(0))
        });

        emit RequestSent(requestCount, _projectId, msg.sender);
    }

    function acceptRequest(uint _requestId) public payable {
        Request storage request = requests[_requestId];
        require(request.freelancer != address(0), "No request exists for this ID");
        require(request.status == RequestStatus.Pending, "Request is not pending");

        // Fetch project details
        (,, , uint projectReward, Projects.Status status, address employer) = projectsContract.getProject(request.projectId);
        require(msg.sender == employer, "Only the employer can accept the request");
        require(status == Projects.Status.Open, "Project must be open");

        // Create new escrow contract instance with freelancer and employer details
        request.escrowContract = new Escrow{value: projectReward}(request.freelancer, employer);

        request.status = RequestStatus.Accepted;
        emit RequestAccepted(_requestId, request.freelancer, address(request.escrowContract));
    }

    function rejectRequest(uint _requestId) public {
        Request storage request = requests[_requestId];
        require(request.freelancer != address(0), "No request exists for this ID");
        require(request.status == RequestStatus.Pending, "Request already processed");

        request.status = RequestStatus.Rejected;
        emit RequestRejected(_requestId, request.freelancer);
    }

    

    function getRequest(uint _requestId) public view returns (Request memory) {
        require(requests[_requestId].freelancer != address(0), "No request exists for this ID");
        return requests[_requestId];
    }

    // New function to view all requests
    function viewAllRequests() public view returns (
        uint[] memory requestIds,
        uint[] memory projectIds,
        address[] memory freelancers,
        uint[] memory freelancerRatings,
        RequestStatus[] memory statuses,
        address[] memory escrowContracts
    ) {
        uint count = requestCount;

        // Initialize arrays based on the total request count
        requestIds = new uint[](count);
        projectIds = new uint[](count);
        freelancers = new address[](count);
        freelancerRatings = new uint[](count);
        statuses = new RequestStatus[](count);
        escrowContracts = new address[](count);

        // Populate the arrays with request details
        for (uint i = 1; i <= requestCount; i++) {
            Request storage request = requests[i];
            requestIds[i - 1] = i;
            projectIds[i - 1] = request.projectId;
            freelancers[i - 1] = request.freelancer;
            freelancerRatings[i - 1] = request.freelancerRating;
            statuses[i - 1] = request.status;
            escrowContracts[i - 1] = address(request.escrowContract);
        }

        return (requestIds, projectIds, freelancers, freelancerRatings, statuses, escrowContracts);
    }


    function viewAllReviewResponses() public view returns (
        uint[] memory responseIds,
        uint[] memory milestoneIds,
        address[] memory freelancers,
        string[] memory responses,
        bool[] memory acceptedStatuses
    ) {
        uint count = responseCount;

        // Initialize arrays based on the total response count
        responseIds = new uint[](count);
        milestoneIds = new uint[](count);
        freelancers = new address[](count);
        responses = new string[](count);
        acceptedStatuses = new bool[](count);

        // Populate the arrays with response details
        for (uint i = 1; i <= count; i++) {
            ReviewResponse storage reviewResponse = reviewResponses[i];
            responseIds[i - 1] = reviewResponse.id;
            milestoneIds[i - 1] = reviewResponse.milestoneId;
            freelancers[i - 1] = reviewResponse.freelancer;
            responses[i - 1] = reviewResponse.response;
            acceptedStatuses[i - 1] = reviewResponse.accepted;
        }

        return (responseIds, milestoneIds, freelancers, responses, acceptedStatuses);
    }


    // function acceptMilestone(uint _milestoneId, uint _actualDaysTaken, uint _delayPenalty, uint _requestId) public payable {
    //     Request memory request = getRequest(_requestId); // Retrieve the request using requestId

    //     // Ensure projectId is valid
    //     require(request.projectId > 0 && request.projectId <= projectsContract.projectCount(), "Project does not exist");

    //     // Retrieve the project details using the getProject function
    //     (, , , uint reward, , address employer) = projectsContract.getProject(request.projectId);
    //     require(msg.sender == employer, "Only the employer can accept milestones");

    //     // Ensure milestoneId is valid
    //     (
    //         uint[] memory ids,
    //         uint[] memory projectIds,
    //         string[] memory names,
    //         string[] memory descriptions,
    //         uint[] memory daycounts,
    //         uint[] memory percentages,
    //         bool[] memory completions,
    //         string[] memory proofFileHashes
    //     ) = projectsContract.getMilestones(request.projectId);

    //     // Check if the milestone exists and is within bounds
    //     require(_milestoneId > 0 && _milestoneId <= ids.length, "Milestone does not exist");
        
    //     // Fetch milestone data by using _milestoneId as an index
    //     uint milestoneIndex = _milestoneId - 1;
    //     require(!completions[milestoneIndex], "Milestone already completed");
    //     require(bytes(proofFileHashes[milestoneIndex]).length > 0, "Proof file not uploaded");

    //     // Mark the milestone as completed
    //     projectsContract.completeMilestone(request.projectId, _milestoneId);

    //     // Calculate and update freelancer rating based on the provided formula
    //     uint currentRating = projectsContract.getFreelancerRating(request.freelancer);
    //     uint rewardWeight = (percentages[milestoneIndex] * reward) / 100;
    //     int ratingChange = int((5 * 100 * rewardWeight * daycounts[milestoneIndex]) / (reward * _actualDaysTaken));

    //     // Cap the increment at +0.2 if positive
    //     if (ratingChange > 20) {
    //         ratingChange = 20;
    //     }

    //     uint newRating = uint(int(currentRating) + ratingChange);

    //     // Ensure new rating doesn't exceed 5.0 (500 basis points)
    //     if (newRating > 500) {
    //         newRating = 500;
    //     }

    //     // Update the freelancer's rating
    //     projectsContract.setFreelancerRating(request.freelancer, newRating);

    //     // Release milestone payment from the escrow with the specified penalty
    //     uint milestonePercentage = percentages[milestoneIndex];
    //     request.escrowContract.releaseMilestonePayment(milestonePercentage, _delayPenalty);

    //     emit MilestoneAccepted(request.projectId, _milestoneId, newRating);
    // }


    function viewRequestsByEmployer() public view returns (
            uint[] memory requestIds,
            uint[] memory projectIds,
            address[] memory freelancers,
            uint[] memory freelancerRatings,
            RequestStatus[] memory statuses,
            address[] memory escrowContracts
        ) {
            uint count = 0;

            // Count requests that belong to projects owned by the employer
            for (uint i = 1; i <= requestCount; i++) {
                uint projectId = requests[i].projectId;
                (, , , , , address employer) = projectsContract.getProject(projectId);
                if (employer == msg.sender) {
                    count++;
                }
            }

            // Initialize arrays based on the count of matching requests
            requestIds = new uint[](count);
            projectIds = new uint[](count);
            freelancers = new address[](count);
            freelancerRatings = new uint[](count);
            statuses = new RequestStatus[](count);
            escrowContracts = new address[](count);

            uint index = 0;

            // Populate the arrays with matching request details
            for (uint i = 1; i <= requestCount; i++) {
                uint projectId = requests[i].projectId;
                (, , , , , address employer) = projectsContract.getProject(projectId);
                if (employer == msg.sender) {
                    Request storage request = requests[i];
                    requestIds[index] = i;
                    projectIds[index] = request.projectId;
                    freelancers[index] = request.freelancer;
                    freelancerRatings[index] = request.freelancerRating;
                    statuses[index] = request.status;
                    escrowContracts[index] = address(request.escrowContract);
                    index++;
                }
            }

            return (requestIds, projectIds, freelancers, freelancerRatings, statuses, escrowContracts);
    }

    function sendMilestoneReviewRequest(uint _milestoneId, string calldata _cid, address _freelancer) public {
        // Create a new milestone review request
        milestoneReviewRequestCount++; // Increment count for unique ID
        milestoneReviewRequests[milestoneReviewRequestCount] = MilestoneReviewRequest({
            id: milestoneReviewRequestCount,
            milestoneId: _milestoneId,
            freelancer: _freelancer,
            cid: _cid,
            reviewed: false // Initially, the request is not reviewed
        });

        emit MilestoneReviewRequestSent(milestoneReviewRequestCount, _milestoneId, _cid); // Emit event
    }

    function viewAllMilestoneReviewRequests() public view returns (
        uint[] memory requestIds,
        uint[] memory milestoneIds,
        address[] memory freelancers,
        string[] memory cids,
        bool[] memory reviewedStatuses
    ) {
        uint count = milestoneReviewRequestCount;

        // Initialize arrays based on the total count of review requests
        requestIds = new uint[](count);
        milestoneIds = new uint[](count);
        freelancers = new address[](count);
        cids = new string[](count);
        reviewedStatuses = new bool[](count);

        // Populate the arrays with review request details
        for (uint i = 1; i <= milestoneReviewRequestCount; i++) {
            MilestoneReviewRequest storage reviewRequest = milestoneReviewRequests[i];
            requestIds[i - 1] = reviewRequest.id;
            milestoneIds[i - 1] = reviewRequest.milestoneId;
            freelancers[i - 1] = reviewRequest.freelancer;
            cids[i - 1] = reviewRequest.cid;
            reviewedStatuses[i - 1] = reviewRequest.reviewed;
        }

        return (requestIds, milestoneIds, freelancers, cids, reviewedStatuses);
    }


    function getEscrowAccountFromReviewRequest(uint _reviewRequestId, uint _projectId) public view returns (Escrow) {
        // Fetch the MilestoneReviewRequest using the provided ID
        MilestoneReviewRequest storage reviewRequest = milestoneReviewRequests[_reviewRequestId];

        // Ensure the review request exists
        require(reviewRequest.id != 0, "Review request does not exist");
        
        // Find the corresponding request based on the project ID and freelancer address
        for (uint i = 0; i < requestCount; i++) {
            Request storage request = requests[i];

            // Check if the request matches the provided projectId and the freelancer address from the review request
            if (request.projectId == _projectId && request.freelancer == reviewRequest.freelancer && request.status == RequestStatus.Accepted) {
                return request.escrowContract; // Return the escrow contract associated with the request
            }
        }

        // If no matching request was found, revert with an error message
        revert("No matching request found for this review request");
    }




    function acceptMilestoneReviewRequest(uint _reviewRequestId, uint _projId) public payable {
        // Fetch the  request using the ID
        MilestoneReviewRequest storage reviewRequest = milestoneReviewRequests[_reviewRequestId];
        require(!reviewRequest.reviewed, "Review request already accepted");

        // Get the milestone ID from the  request
        uint milestoneId = reviewRequest.milestoneId;

        // Retrieve the associated milestones for the project
        (
            uint[] memory ids,
            uint[] memory projectIds,
            string[] memory names,
            string[] memory descriptions,
            uint[] memory daycounts,
            uint[] memory percentages,
            bool[] memory completions,
            string[] memory proofFileHashes
        ) = projectsContract.getMilestones(_projId);

        // Initialize variables to store the milestone data once we find it
        bool milestoneFound = false;
        string memory milestoneName;
        string memory milestoneDescription;
        uint milestoneDaycount;
        uint milestonePercentage;
        bool milestoneCompleted;
        string memory milestoneProofFileHash;

        // Search for the milestone with the specified milestoneId
        for (uint i = 0; i < ids.length; i++) {
            if (ids[i] == milestoneId) {
                milestoneFound = true;
                milestoneName = names[i];
                milestoneDescription = descriptions[i];
                milestoneDaycount = daycounts[i];
                milestonePercentage = percentages[i];
                milestoneCompleted = completions[i];
                milestoneProofFileHash = proofFileHashes[i];
                break;
            }
        }

        require(milestoneFound, "Milestone does not exist");

        reviewRequest.reviewed = true;

        // Get freelancer's address from the request
        address freelancer = reviewRequest.freelancer;

        // Update freelancer rating based on the milestone percentage
        uint currentRating = projectsContract.getFreelancerRating(freelancer);
        // uint rewardWeight = projReward / 100;
        uint newRating = currentRating + (5 * milestonePercentage / 100);

        // Ensure the new rating does not exceed 500
        if (newRating > 500) {
            newRating = 500;
        }

        // Set the new rating for the freelancer
        projectsContract.setFreelancerRating(freelancer, newRating);


        getEscrowAccountFromReviewRequest(_reviewRequestId, _projId).releaseMilestonePayment(milestonePercentage);


        uint _milestoneId = reviewRequest.milestoneId;
        address _freelancer = reviewRequest.freelancer;

        responseCount++;
        reviewResponses[responseCount] = ReviewResponse({
            id: responseCount,
            milestoneId: _milestoneId,
            freelancer: _freelancer,
            response: "",
            accepted: true
        });
    }



    // function acceptMilestoneReviewRequest(uint _reviewRequestId, uint _projId) public payable {
    //     // Fetch the  request using the ID
    //     MilestoneReviewRequest storage reviewRequest = milestoneReviewRequests[_reviewRequestId];
    //     require(!reviewRequest.reviewed, "Review request already accepted");

    //     // Get the milestone ID from the  request
    //     uint milestoneId = reviewRequest.milestoneId;

    //     // Retrieve the associated milestones for the project
    //     (
    //         uint[] memory ids,
    //         uint[] memory projectIds,
    //         string[] memory names,
    //         string[] memory descriptions,
    //         uint[] memory daycounts,
    //         uint[] memory percentages,
    //         bool[] memory completions,
    //         string[] memory proofFileHashes
    //     ) = projectsContract.getMilestones(_projId);

    //     // Initialize variables to store the milestone data once we find it
    //     bool milestoneFound = false;
    //     string memory milestoneName;
    //     string memory milestoneDescription;
    //     uint milestoneDaycount;
    //     uint milestonePercentage;
    //     bool milestoneCompleted;
    //     string memory milestoneProofFileHash;

    //     // Search for the milestone with the specified milestoneId
    //     for (uint i = 0; i < ids.length; i++) {
    //         if (ids[i] == milestoneId) {
    //             milestoneFound = true;
    //             milestoneName = names[i];
    //             milestoneDescription = descriptions[i];
    //             milestoneDaycount = daycounts[i];
    //             milestonePercentage = percentages[i];
    //             milestoneCompleted = completions[i];
    //             milestoneProofFileHash = proofFileHashes[i];
    //             break;
    //         }
    //     }

    //     require(milestoneFound, "Milestone does not exist");

    //     // Use getProject to retrieve the project details
    //     (
    //         uint projId,
    //         string memory projName,
    //         string memory projDescription,
    //         uint projReward,
    //         Projects.Status projStatus,
    //         address projEmployer
    //     ) = projectsContract.getProject(_projId);

    //     // Verify that the sender is the employer of the project
    //     require(projEmployer == msg.sender, "Only the employer can accept milestones");

    //     // Mark the review request as accepted
    //     reviewRequest.reviewed = true;

    //     // Get freelancer's address from the request
    //     address freelancer = reviewRequest.freelancer;

    //     // Update freelancer rating based on the milestone percentage
    //     uint currentRating = projectsContract.getFreelancerRating(freelancer);
    //     uint rewardWeight = projReward / 100;
    //     uint newRating = currentRating + (5 * milestonePercentage / rewardWeight);

    //     // Ensure the new rating does not exceed 500
    //     if (newRating > 500) {
    //         newRating = 500;
    //     }

    //     // Set the new rating for the freelancer
    //     projectsContract.setFreelancerRating(freelancer, newRating);

    //     // Find the request with the matching projectId and freelancer
    //     uint requestIndex;
    //     bool foundRequest = false;

    //     for (uint i = 0; i < requestCount; i++) {
    //         if (requests[i].projectId == _projId && requests[i].freelancer == freelancer && requests[i].status == RequestStatus.Accepted) {
    //             requestIndex = i;
    //             foundRequest = true;
    //             break;
    //         }
    //     }
    //     require(foundRequest, "Associated request not found");

    //     // Release the milestone payment from escrow using the found request
    //     requests[requestIndex].escrowContract.releaseMilestonePayment(milestonePercentage);

    //     // Emit an event to record the milestone acceptance
    //     emit MilestoneAccepted(projId, milestoneId, newRating);
    // }

    // function acceptMilestoneReviewRequest(uint _reviewRequestId, uint _projId) public payable {
    //     // Fetch the request using the ID
    //     MilestoneReviewRequest storage reviewRequest = milestoneReviewRequests[_reviewRequestId];
    //     require(reviewRequest.id != 0, "Review request does not exist");
    //     require(!reviewRequest.reviewed, "Review request already accepted");

    //     // Get the milestone ID from the request
    //     uint milestoneId = reviewRequest.milestoneId;

    //     // Retrieve the associated milestones for the project
    //     (
    //         uint[] memory ids,
    //         ,  // projectIds not used
    //         ,  // names not used
    //         ,  // descriptions not used
    //         uint[] memory daycounts,
    //         uint[] memory percentages,
    //         bool[] memory completions,
    //         string[] memory proofFileHashes
    //     ) = projectsContract.getMilestones(_projId);

    //     // Verify that the milestone exists and get its index
    //     uint milestoneIndex;
    //     bool milestoneFound = false;
    //     for (uint i = 0; i < ids.length; i++) {
    //         if (ids[i] == milestoneId) {
    //             milestoneIndex = i;
    //             milestoneFound = true;
    //             break;
    //         }
    //     }
    //     require(milestoneFound, "Milestone does not exist");
    //     require(!completions[milestoneIndex], "Milestone already completed");
    //     require(bytes(proofFileHashes[milestoneIndex]).length > 0, "Proof file not uploaded");

    //     // Get project details
    //     (, , , uint projReward, , address projEmployer) = projectsContract.getProject(_projId);
    //     require(msg.sender == projEmployer, "Only the employer can accept milestones");

    //     // Mark the milestone as completed in the Projects contract
    //     projectsContract.completeMilestone(_projId, milestoneId);

    //     // Mark the review request as accepted
    //     reviewRequest.reviewed = true;

    //     // Get freelancer's address from the request
    //     address freelancer = reviewRequest.freelancer;

    //     // Update freelancer rating
    //     uint currentRating = projectsContract.getFreelancerRating(freelancer);
    //     uint milestonePercentage = percentages[milestoneIndex];
        
    //     // Calculate rating increase based on milestone percentage and project reward
    //     uint ratingIncrease = (5 * milestonePercentage * daycounts[milestoneIndex]) / 100;
    //     uint newRating = currentRating + ratingIncrease;
        
    //     // Cap the rating at 500 (5.0)
    //     if (newRating > 500) {
    //         newRating = 500;
    //     }

    //     // Update the freelancer's rating
    //     projectsContract.setFreelancerRating(freelancer, newRating);

    //     // Find the associated request for the escrow
    //     uint requestId;
    //     bool foundRequest = false;
    //     for (uint i = 1; i <= requestCount; i++) {
    //         if (requests[i].projectId == _projId && 
    //             requests[i].freelancer == freelancer && 
    //             requests[i].status == RequestStatus.Accepted) {
    //             requestId = i;
    //             foundRequest = true;
    //             break;
    //         }
    //     }
    //     require(foundRequest, "Associated request not found");
    //     require(address(requests[requestId].escrowContract) != address(0), "Escrow contract not found");

    //     // Release the milestone payment from escrow
    //     requests[requestId].escrowContract.releaseMilestonePayment(milestonePercentage);

    //     // Emit event
    //     emit MilestoneAccepted(_projId, milestoneId, newRating);
    // }




    function rejectMilestoneReviewRequest(uint _reviewRequestId, string calldata _reason)  public {
        MilestoneReviewRequest storage reviewRequest = milestoneReviewRequests[_reviewRequestId];
        require(!reviewRequest.reviewed, "Review request already processed");
        reviewRequest.reviewed = true;

        uint _milestoneId = reviewRequest.milestoneId;
        address _freelancer = reviewRequest.freelancer;

        responseCount++;
        // request.escrowContract = new ReviewResponse{value: projectReward}(request.freelancer, employer);
        reviewResponses[responseCount] = ReviewResponse({
            id: responseCount,
            milestoneId: _milestoneId,
            freelancer: _freelancer,
            response: _reason,
            accepted: false
        });

        emit MilestoneReviewRequestRejected(_reviewRequestId, _reason);
    }

    function acceptRejectionReason(uint _reviewRequestId) public {
        // Fetch the request using the ID
        MilestoneReviewRequest storage reviewRequest = milestoneReviewRequests[_reviewRequestId];
        
        // Check if the request exists and if it is not already reviewed
        require(reviewRequest.freelancer == msg.sender, "Only the freelancer can accept the rejection reason");
        require(!reviewRequest.reviewed, "Review request already reviewed");

        // Accept the rejection reason and mark the request as reviewed
        reviewRequest.reviewed = true;

        // Emit an event for this action (optional)
        emit RejectionReasonAccepted(_reviewRequestId);
    }


    function viewAcceptedProjectsByFreelancer(address freelancer) public view returns (
        uint[] memory ids, 
        string[] memory names, 
        string[] memory descriptions, 
        uint[] memory rewards, 
        Projects.Status[] memory statuses, // Change here to use Projects.Status
        address[] memory employers
    ) {
        // Temporary storage for matched projects
        uint[] memory tempIds = new uint[](requestCount); 
        string[] memory tempNames = new string[](requestCount);
        string[] memory tempDescriptions = new string[](requestCount);
        uint[] memory tempRewards = new uint[](requestCount);
        Projects.Status[] memory tempStatuses = new Projects.Status[](requestCount); // Change here to use Projects.Status
        address[] memory tempEmployers = new address[](requestCount);

        uint matchCount = 0; // Count of matched projects

        for (uint i = 1; i <= requestCount; i++) {
            Request storage req = requests[i];
            if (req.status == RequestStatus.Accepted && req.freelancer == freelancer) {
                // Unpack the return values from getProject
                (uint id, string memory name, string memory description, uint reward, Projects.Status status, address employer) = 
                    projectsContract.getProject(req.projectId); // Call the function
                
                // Assign the unpacked values to temporary storage
                tempIds[matchCount] = id;
                tempNames[matchCount] = name;
                tempDescriptions[matchCount] = description;
                tempRewards[matchCount] = reward;
                tempStatuses[matchCount] = status;
                tempEmployers[matchCount] = employer;
                matchCount++;
            }
        }

        // Create memory arrays of the exact size of matches found
        ids = new uint[](matchCount);
        names = new string[](matchCount);
        descriptions = new string[](matchCount);
        rewards = new uint[](matchCount);
        statuses = new Projects.Status[](matchCount); // Change here to use Projects.Status
        employers = new address[](matchCount);

        for (uint j = 0; j < matchCount; j++) {
            ids[j] = tempIds[j];
            names[j] = tempNames[j];
            descriptions[j] = tempDescriptions[j];
            rewards[j] = tempRewards[j];
            statuses[j] = tempStatuses[j];
            employers[j] = tempEmployers[j];
        }

        return (ids, names, descriptions, rewards, statuses, employers);
    }
    

    function addFile(
        uint _milestoneId, 
        string memory _name, 
        string memory _rid, 
        string memory _cid
    ) public {
        // Create a new File struct with a unique ID and add it to the milestoneFiles map
        File memory newFile = File({
            id: fileCount, // unique global ID for each file
            milestoneId: _milestoneId,
            name: _name,
            rid: _rid,
            cid: _cid
        });
        
        milestoneFiles[_milestoneId].push(newFile); // Add file to the array for the specific milestone
        fileCount++; // Increment the global file count
    }

    function viewAllFilesForMilestone(uint _milestoneId) 
        public 
        view 
        returns (
            uint[] memory ids,
            uint[] memory milestoneIds,
            string[] memory names,
            string[] memory rids,
            string[] memory cids
        ) 
    {
        uint count = fileCount; // Assuming 'fileCount' keeps track of the total files added

        // Initialize arrays based on the total file count for the specified milestone
        ids = new uint[](count);
        milestoneIds = new uint[](count);
        names = new string[](count);
        rids = new string[](count);
        cids = new string[](count);

        // Populate the arrays with file details for the given milestone
        uint index = 0;
        for (uint i = 0; i < count; i++) {
            if (milestoneFiles[_milestoneId][i].milestoneId == _milestoneId) {
                File storage file = milestoneFiles[_milestoneId][i];
                ids[index] = file.id;
                milestoneIds[index] = file.milestoneId;
                names[index] = file.name;
                rids[index] = file.rid;
                cids[index] = file.cid;
                index++;
            }
        }

        return (ids, milestoneIds, names, rids, cids);
    }

    // ===== NEW FUNCTIONS FOR ADDITIONAL FEATURES =====

    /**
     * Send a request draft from freelancer to employer (client)
     */
    function sendRequestDraft(uint _requestId, string memory _draftContent) public {
        Request storage request = requests[_requestId];
        require(request.freelancer != address(0), "Request does not exist");
        require(request.freelancer == msg.sender, "Only the freelancer can send drafts");
        
        // Get employer address from project
        (,, , , , address employer) = projectsContract.getProject(request.projectId);
        
        requestDraftCount++;
        requestDrafts[requestDraftCount] = RequestDraft({
            id: requestDraftCount,
            requestId: _requestId,
            projectId: request.projectId,
            freelancer: msg.sender,
            employer: employer,
            draftContent: _draftContent,
            timestamp: block.timestamp,
            reviewed: false
        });
        
        emit RequestDraftSent(requestDraftCount, _requestId, msg.sender, employer);
    }

    /**
     * Get all request drafts for a specific request
     */
    function getRequestDrafts(uint _requestId) public view returns (RequestDraft[] memory) {
        uint count = 0;
        for (uint i = 1; i <= requestDraftCount; i++) {
            if (requestDrafts[i].requestId == _requestId) {
                count++;
            }
        }
        
        RequestDraft[] memory drafts = new RequestDraft[](count);
        uint index = 0;
        for (uint i = 1; i <= requestDraftCount; i++) {
            if (requestDrafts[i].requestId == _requestId) {
                drafts[index] = requestDrafts[i];
                index++;
            }
        }
        return drafts;
    }

    /**
     * Allows employer (client) to rate freelancer
     */
    function rateFreelancer(uint _requestId, uint _rating, string memory _review) public {
        require(_rating > 0 && _rating <= 5, "Rating must be between 1 and 5");
        
        Request storage request = requests[_requestId];
        require(request.freelancer != address(0), "Request does not exist");
        
        // Get employer address from project
        (,, , , , address employer) = projectsContract.getProject(request.projectId);
        require(msg.sender == employer, "Only the employer can rate the freelancer");
        
        freelancerRatingCount++;
        freelancerRatings[freelancerRatingCount] = FreelancerRating({
            ratingId: freelancerRatingCount,
            requestId: _requestId,
            rater: msg.sender,
            freelancer: request.freelancer,
            rating: _rating,
            review: _review,
            timestamp: block.timestamp
        });
        
        freelancerRatingsList[request.freelancer].push(freelancerRatingCount);
        
        emit FreelancerRatingSubmitted(freelancerRatingCount, msg.sender, request.freelancer, _rating);
    }

    /**
     * Get all ratings for a specific freelancer
     */
    function getFreelancerRatings(address _freelancer) public view returns (FreelancerRating[] memory) {
        uint[] memory ratingIds = freelancerRatingsList[_freelancer];
        FreelancerRating[] memory ratings = new FreelancerRating[](ratingIds.length);
        
        for (uint i = 0; i < ratingIds.length; i++) {
            ratings[i] = freelancerRatings[ratingIds[i]];
        }
        
        return ratings;
    }

    /**
     * Get average rating for a freelancer
     */
    function getFreelancerAverageRating(address _freelancer) public view returns (uint) {
        uint[] memory ratingIds = freelancerRatingsList[_freelancer];
        if (ratingIds.length == 0) return 0;
        
        uint totalRating = 0;
        for (uint i = 0; i < ratingIds.length; i++) {
            totalRating += freelancerRatings[ratingIds[i]].rating;
        }
        
        return totalRating / ratingIds.length;
    }

    /**
     * Mark project as completed by employer (client)
     */
    function completeProject(uint _requestId) public {
        Request storage request = requests[_requestId];
        require(request.freelancer != address(0), "Request does not exist");
        require(request.status == RequestStatus.Accepted, "Request must be accepted");
        
        // Get employer address from project
        (,, , , , address employer) = projectsContract.getProject(request.projectId);
        require(msg.sender == employer, "Only the employer can complete the project");
        
        projectCompletionCount++;
        projectCompletions[projectCompletionCount] = ProjectCompletion({
            completionId: projectCompletionCount,
            projectId: request.projectId,
            requestId: _requestId,
            employer: employer,
            freelancer: request.freelancer,
            isCompleted: true,
            completionTime: block.timestamp
        });
        
        emit ProjectCompleted(request.projectId, _requestId, employer, request.freelancer);
    }

    /**
     * Get project completion status
     */
    function getProjectCompletion(uint _projectId) public view returns (ProjectCompletion memory) {
        for (uint i = 1; i <= projectCompletionCount; i++) {
            if (projectCompletions[i].projectId == _projectId) {
                return projectCompletions[i];
            }
        }
        revert("Project completion not found");
    }
}

