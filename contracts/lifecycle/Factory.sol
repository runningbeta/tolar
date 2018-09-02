pragma solidity 0.4.24;


/**
 * @title Factory
 * @dev Base Factory contract that registers and counts instantiations.
 */
contract Factory {

  event ContractInstantiation(address sender, address instantiation);

  mapping(address => bool) public isInstantiation;
  mapping(address => address[]) public instantiations;

  /**
   * @dev Returns number of instantiations by creator.
   * @param _creator Contract creator.
   * @return Returns number of instantiations by creator.
   */
  function getInstantiationCount(address _creator) public view returns (uint) {
    return instantiations[_creator].length;
  }

  /**
   * @dev Registers contract in factory registry.
   * @param _instantiation Address of contract instantiation.
   */
  function register(address _instantiation) internal {
    isInstantiation[_instantiation] = true;
    instantiations[msg.sender].push(_instantiation);
    emit ContractInstantiation(msg.sender, _instantiation);
  }
}
