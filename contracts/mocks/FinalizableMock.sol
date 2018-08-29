pragma solidity ^0.4.24;

import "../lifecycle/Finalizable.sol";


/// @dev mock class using TokenPullPayment
contract FinalizableMock is Finalizable {

  function finalized() public onlyFinalized {
    // noop
  }

  function notFinalized() public onlyNotFinalized {
    // noop
  }

}
